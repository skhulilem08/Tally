import { z } from 'zod'

export const memoryChangeSchema = z.object({
  revision: z.number().int().min(1),
  sourceMessageId: z.string().uuid(),
  facts: z.array(z.object({
    label: z.string().max(80),
    before: z.string().max(500).nullable(),
    after: z.string().max(500).nullable(),
  })).max(60),
  narrativeBefore: z.string().max(8000).nullable(),
  narrativeAfter: z.string().max(8000).nullable(),
})

export function recordMemoryUpdate(state, memory, sourceMessageId) {
  const before = new Map(state.memory.facts.map((fact) => [fact.label, fact.value]))
  const after = new Map(memory.facts.map((fact) => [fact.label, fact.value]))
  const facts = [...new Set([...before.keys(), ...after.keys()])]
    .filter((label) => before.get(label) !== after.get(label))
    .map((label) => ({ label, before: before.get(label) ?? null, after: after.get(label) ?? null }))
  const narrativeChanged = state.memory.narrative !== memory.narrative
  if (!facts.length && !narrativeChanged) return {}
  const revision = (state.memoryRevision || 0) + 1
  const change = {
    revision, sourceMessageId, facts,
    narrativeBefore: narrativeChanged ? state.memory.narrative : null,
    narrativeAfter: narrativeChanged ? memory.narrative : null,
  }
  const history = [...(state.memoryHistory || []), change]
  let floor = state.memoryCorrectionFloor || 0
  // Keep provenance bounded without silently attempting an unsafe old rollback.
  while (history.length > 30 || new TextEncoder().encode(JSON.stringify(history)).byteLength > 50000) {
    floor = Math.max(floor, history.shift().revision)
  }
  return { memory, memoryRevision: revision, memoryHistory: history, memoryCorrectionFloor: floor }
}

export function correctConversation(state, messageId, text, newId) {
  const index = state.messages.findIndex((message) => message.id === messageId && message.role === 'user')
  if (index < 0) throw new Error('This turn is no longer in the current conversation.')
  const target = state.messages[index]
  if ((target.memoryRevision || 0) < (state.memoryCorrectionFloor || 0)) {
    throw new Error('This older turn cannot be corrected safely after the memory-history limit. Say the correction in a new voice turn instead; saved preferences are unchanged.')
  }
  const superseded = new Set(state.messages.slice(index).filter((message) => message.role === 'user').map((message) => message.id))
  const facts = new Map(state.memory.facts.map((fact) => [fact.label, fact.value]))
  let narrative = state.memory.narrative
  // Undo only changes attributable to the superseded conversation. Later
  // explicit memory edits re-anchor history, so independent preferences stay.
  for (const change of [...(state.memoryHistory || [])].reverse()) {
    if (!superseded.has(change.sourceMessageId)) continue
    for (const fact of change.facts) {
      if ((facts.get(fact.label) ?? null) !== fact.after) continue
      if (fact.before === null) facts.delete(fact.label)
      else facts.set(fact.label, fact.before)
    }
    if (change.narrativeAfter !== null && narrative === change.narrativeAfter) narrative = change.narrativeBefore || ''
  }
  const memory = { facts: [...facts].map(([label, value]) => ({ label, value })), narrative }
  const memoryChanged = JSON.stringify(memory) !== JSON.stringify(state.memory)
  const revision = (state.memoryRevision || 0) + (memoryChanged ? 1 : 0)
  return {
    ...state,
    memory,
    memoryRevision: revision,
    memoryHistory: (state.memoryHistory || []).filter((change) => !superseded.has(change.sourceMessageId)),
    messages: [
      ...state.messages.slice(0, index),
      { id: newId(), role: 'user', content: text, spoken: true, memoryRevision: revision },
      ...(memoryChanged ? [{ id: newId(), role: 'event', content: 'Memory updated' }] : []),
    ].slice(-60),
    summary: '', draft: null, groceryPlan: null,
    recipeRequestId: newId(), groceryRequestId: newId(),
  }
}

export function explicitMemoryUpdate(state, memory) {
  // A deliberate edit establishes an independent canonical preference set.
  return {
    memory, memoryRevision: (state.memoryRevision || 0) + 1,
    memoryHistory: [], memoryCorrectionFloor: 0,
  }
}
