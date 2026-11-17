import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { emptyAssistantState, assistantStateSchema } from '../shared/assistant-state.js'
import { correctConversation, explicitMemoryUpdate, recordMemoryUpdate } from '../shared/assistant-memory.js'

const fact = (label, value) => ({ label, value })
function turn(state, content) {
  const message = { id: randomUUID(), role: 'user', content, spoken: true, memoryRevision: state.memoryRevision }
  return { ...state, messages: [...state.messages, message] }
}
function remember(state, memory) {
  return { ...state, ...recordMemoryUpdate(state, memory, state.messages.findLast((message) => message.role === 'user').id) }
}

test('correcting a spoken turn preserves unrelated saved preferences and narrative', () => {
  const saved = { facts: [fact('Favorite herb', 'Basil')], narrative: 'Prefers quick meals after work.' }
  let state = { ...emptyAssistantState(), ...explicitMemoryUpdate(emptyAssistantState(), saved) }
  state = turn(state, 'I cook for ten')
  const target = state.messages[0].id
  state = remember(state, { facts: [...saved.facts, fact('Servings', 'Ten')], narrative: `${saved.narrative} Cooks for ten.` })
  const corrected = correctConversation(state, target, 'I cook for two', randomUUID)
  assert.deepEqual(corrected.memory, saved)
  assert.equal(corrected.messages.find((message) => message.role === 'user').content, 'I cook for two')
  assert.equal(corrected.memoryHistory.length, 0)
  assert.deepEqual(assistantStateSchema.parse(JSON.parse(JSON.stringify(corrected))).memory, saved)
})

test('correction reverses superseded changes in order and restores earlier values', () => {
  let state = emptyAssistantState()
  state.memory = { facts: [fact('Servings', 'Two'), fact('Favorite herb', 'Basil')], narrative: 'Usually cooks for two.' }
  const saved = structuredClone(state.memory)
  state = turn(state, 'I cook for ten')
  const target = state.messages[0].id
  state = remember(state, { facts: [fact('Servings', 'Ten'), fact('Favorite herb', 'Basil')], narrative: 'Cooks for ten.' })
  state = turn(state, 'Actually twelve')
  state = remember(state, { facts: [fact('Servings', 'Twelve'), fact('Favorite herb', 'Basil')], narrative: 'Cooks for twelve.' })
  const corrected = correctConversation(state, target, 'Still two', randomUUID)
  assert.deepEqual(corrected.memory, saved)
  assert.equal(corrected.messages.filter((message) => message.role === 'user').length, 1)
})

test('explicit later memory edits survive correction of an older spoken turn', () => {
  let state = turn(emptyAssistantState(), 'I like thyme')
  const target = state.messages[0].id
  state = remember(state, { facts: [fact('Herb', 'Thyme')], narrative: '' })
  const edited = { facts: [fact('Herb', 'Basil'), fact('Dinner', 'Vegetarian')], narrative: 'User-edited preferences.' }
  state = { ...state, ...explicitMemoryUpdate(state, edited) }
  assert.deepEqual(correctConversation(state, target, 'I meant basil', randomUUID).memory, edited)
})

test('correcting a later turn preserves memory learned before that turn', () => {
  let state = turn(emptyAssistantState(), 'Remember basil')
  state = remember(state, { facts: [fact('Herb', 'Basil')], narrative: 'Likes basil.' })
  const saved = structuredClone(state.memory)
  state = turn(state, 'Remember ten servings')
  const target = state.messages.at(-1).id
  state = remember(state, { facts: [...saved.facts, fact('Servings', 'Ten')], narrative: 'Likes basil. Cooks for ten.' })
  const corrected = correctConversation(state, target, 'Two servings', randomUUID)
  assert.deepEqual(corrected.memory, saved)
  assert.equal(corrected.memoryHistory.length, 1)
})

test('expired correction history fails explicitly without mutating saved preferences', () => {
  let state = emptyAssistantState()
  state = turn(state, 'An old turn')
  const target = state.messages[0].id
  for (let i = 0; i < 33; i++) state = remember(state, { facts: [fact('Version', String(i))], narrative: '' })
  assert.ok(state.memoryCorrectionFloor > 0)
  const before = structuredClone(state)
  assert.throws(() => correctConversation(state, target, 'Correction', randomUUID), /cannot be corrected safely/)
  assert.deepEqual(state, before)
})
