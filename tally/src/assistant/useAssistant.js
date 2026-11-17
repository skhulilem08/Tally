import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { recipeSchema, planSchema } from '../../server/validation.js'
import { emptyAssistantState, memorySchema } from '../../shared/assistant-state.js'
import { ASSISTANT_GUEST_KEY, loadAssistant, storeAssistant } from './storage.js'
import { useVoiceCall } from './useVoiceCall.js'
import { correctConversation, explicitMemoryUpdate, recordMemoryUpdate } from '../../shared/assistant-memory.js'

const id = () => crypto.randomUUID()
const defaultManual = () => ({
  kind: 'choose', step: 0,
  recipe: { title: '', description: '', servings: 2, prepMinutes: null, cookMinutes: null, ingredients: [{ name: '', amount: '', unit: '' }], steps: [''], notes: '' },
  groceries: { name: '', text: '' },
  recipeRequestId: id(), groceryRequestId: id(),
})
const normalizeRecipe = (draft) => recipeSchema.parse({
  ...draft,
  servings: Number(draft.servings),
  prepMinutes: draft.prepMinutes === '' || draft.prepMinutes == null ? null : Number(draft.prepMinutes),
  cookMinutes: draft.cookMinutes === '' || draft.cookMinutes == null ? null : Number(draft.cookMinutes),
  ingredients: draft.ingredients.map((row) => ({ ...row, amount: Number(row.amount) })),
})
const normalizePlan = (plan) => ({
  name: plan.name,
  ...planSchema.parse({
    selections: plan.selections.map((row) => ({ ...row, servings: Number(row.servings) })),
    inventory: plan.inventory.map((row) => ({ ...row, amount: Number(row.amount) })),
  }),
})
const readableError = (error) => error.name === 'ZodError'
  ? error.issues.slice(0, 3).map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(' ')
  : error.message

export function useAssistant(kitchen) {
  const owner = kitchen.owner
  const [snapshot, setSnapshot] = useState(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [groceryPreview, setGroceryPreview] = useState(null)
  const live = useRef({ owner: null, revision: 0, state: null, sequence: 0, pending: 0, failed: false })
  const queue = useRef(Promise.resolve())
  const generation = useRef(0)
  const controller = useRef(null)
  const busyRef = useRef(false)
  const ready = snapshot?.owner === owner && !String(owner).startsWith('pending:')

  function cancelTurn() {
    generation.current++
    controller.current?.abort()
    controller.current = null
    busyRef.current = false
    setBusy(false)
  }
  const voice = useVoiceCall({
    scope: owner,
    onInterrupt: cancelTurn,
    onTranscript: (text, correctionId) => runTurn(text, true, correctionId),
  })
  const voiceRef = useRef(voice)
  voiceRef.current = voice
  const latestKitchen = useRef(kitchen)
  latestKitchen.current = kitchen

  function publish(state, context = live.current) {
    setSnapshot({ owner: context.owner, state })
  }
  function persist(transform, { optimistic = true } = {}) {
    const context = live.current
    if (context.owner !== owner || !context.state || context.failed) return Promise.reject(new Error('Reload the Assistant to restore a current conversation before continuing.'))
    const next = transform(context.state)
    // Retain a bounded recent transcript; the assistant keeps a separate
    // bounded conversation summary. Do not let unbounded history block saves.
    while (next.messages.length > 2 && next.messages.reduce((total, message) => total + message.content.length, 0) > 80000) next.messages.shift()
    if (optimistic) context.state = next
    const sequence = ++context.sequence
    context.pending++
    if (optimistic) publish(next, context)
    const write = queue.current.catch(() => {}).then(async () => {
      if (context.failed) throw new Error('An earlier change could not be saved. Reload before continuing.')
      try {
        const result = await storeAssistant(context.owner, context.revision, next)
        context.revision = result.revision
        if (live.current === context && context.sequence === sequence) {
          context.state = result.state
          publish(result.state, context)
        }
        return result
      } catch (failure) {
        context.failed = true
        if (live.current === context) {
          cancelTurn()
          setError(`${readableError(failure)} Changes in this view may not be saved. Reload to recover the stored version.`)
        }
        throw failure
      } finally { context.pending-- }
    })
    queue.current = write
    return write
  }
  function safePersist(transform) {
    void persist(transform).catch((failure) => setError(readableError(failure)))
  }
  useEffect(() => {
    cancelTurn()
    setInput(''); setError(''); setNotice(''); setMemoryOpen(false); setGroceryPreview(null); setSnapshot(null)
    const context = { owner, revision: 0, state: null, sequence: 0, pending: 0, failed: false }
    live.current = context
    queue.current = Promise.resolve()
    if (!owner || String(owner).startsWith('pending:')) return
    async function load() {
      try {
        const result = await loadAssistant(owner)
        if (live.current !== context) return
        context.revision = result.revision
        context.state = result.state
        publish(result.state, context)
        window.dispatchEvent(new CustomEvent('tally:assistant-mode', { detail: { mode: result.state.mode } }))
        if (new URLSearchParams(window.location.search).get('mode') === 'manual') {
          safePersist((state) => ({ ...state, mode: 'manual' }))
          window.dispatchEvent(new CustomEvent('tally:assistant-mode', { detail: { mode: 'manual' } }))
          const url = new URL(window.location.href)
          url.searchParams.delete('mode')
          history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`)
        }
      } catch (failure) { if (live.current === context) setError(readableError(failure)) }
    }
    void load()
    const freshness = async (event) => {
      if (event?.type === 'storage' && event.key !== ASSISTANT_GUEST_KEY) return
      if (live.current !== context || context.pending || busyRef.current || context.failed) return
      try {
        const result = await loadAssistant(owner)
        if (live.current !== context || context.pending || busyRef.current || result.revision === context.revision) return
        cancelTurn()
        voiceRef.current.end()
        Object.assign(context, { revision: result.revision, state: result.state })
        publish(result.state, context)
        setGroceryPreview(null)
      } catch (failure) { if (live.current === context) setError(readableError(failure)) }
    }
    const manual = () => {
      voiceRef.current.end()
      cancelTurn()
      const mode = context.state?.mode === 'manual' ? 'chat' : 'manual'
      safePersist((state) => ({ ...state, mode }))
      window.dispatchEvent(new CustomEvent('tally:assistant-mode', { detail: { mode } }))
    }
    window.addEventListener('focus', freshness)
    window.addEventListener('storage', freshness)
    window.addEventListener('tally:manual-mode', manual)
    return () => {
      window.removeEventListener('focus', freshness)
      window.removeEventListener('storage', freshness)
      window.removeEventListener('tally:manual-mode', manual)
      cancelTurn()
      if (live.current === context) live.current = { owner: null, state: null, failed: true }
    }
    // Owner changes unmount all in-flight context; event handlers use refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner])

  async function runTurn(text, spoken = false, correctionId = null) {
    if (!text.trim() || !ready || busyRef.current) return ''
    cancelTurn()
    const turn = generation.current
    const context = live.current
    busyRef.current = true; setBusy(true); setError(''); setNotice('')
    let pendingInput = text.trim()
    try {
      await persist((state) => {
        if (correctionId) return correctConversation(state, correctionId, pendingInput, id)
        return {
          ...state,
          messages: [...state.messages, { id: id(), role: 'user', content: pendingInput, spoken, memoryRevision: state.memoryRevision || 0 }].slice(-60),
        }
      }, { optimistic: !correctionId })
      if (turn !== generation.current || live.current !== context) return ''
      const state = context.state
      const sequence = context.sequence
      const abort = new AbortController()
      controller.current = abort
      const validDraft = state.draft ? (() => { try { return normalizeRecipe(state.draft) } catch { throw new Error('Complete or dismiss the unfinished recipe draft before asking Tally to revise it.') } })() : null
      const validPlan = state.groceryPlan?.selections?.length ? normalizePlan(state.groceryPlan) : null
      let messages = state.messages.filter((message) => message.role !== 'event').slice(-24).map(({ role, content }) => ({ role, content }))
      while (messages.reduce((sum, message) => sum + message.content.length, 0) > 48000 && messages.length > 1) messages.shift()
      const response = await api('/assistant', { method: 'POST', signal: abort.signal, body: {
        messages, draft: validDraft, groceryPlan: validPlan,
        recipes: latestKitchen.current.recipes.slice(0, 200).map(({ id: recipeId, title, servings }) => ({ id: recipeId, title, servings })),
        memory: state.memory, memoryEnabled: state.enabled, summary: state.summary, contextRevision: context.revision,
      } })
      if (turn !== generation.current || live.current !== context || sequence !== context.sequence) return ''
      const memoryChanged = state.enabled && response.memoryUpdate &&
        JSON.stringify(response.memoryUpdate) !== JSON.stringify(state.memory)
      const sourceMessageId = state.messages.findLast((message) => message.role === 'user')?.id
      await persist((current) => ({
        ...current,
        messages: [
          ...current.messages, { id: id(), role: 'assistant', content: response.reply },
          ...(memoryChanged ? [{ id: id(), role: 'event', content: 'Memory updated' }] : []),
        ].slice(-60),
        summary: response.summary ?? current.summary,
        ...(memoryChanged ? recordMemoryUpdate(current, response.memoryUpdate, sourceMessageId) : {}),
        draft: response.draft || current.draft,
        groceryPlan: response.groceryPlan || current.groceryPlan,
        recipeRequestId: response.draft ? id() : current.recipeRequestId,
        groceryRequestId: response.groceryPlan ? id() : current.groceryRequestId,
      }), { optimistic: false })
      if (response.groceryPlan) setGroceryPreview(null)
      return turn === generation.current ? response.reply : ''
    } catch (failure) {
      if (live.current === context && turn === generation.current && failure.name !== 'AbortError') {
        setError(readableError(failure))
        throw failure
      }
      return ''
    } finally {
      pendingInput = ''
      if (live.current === context && turn === generation.current) { busyRef.current = false; setBusy(false) }
    }
  }
  async function send(event) {
    event?.preventDefault()
    if (!input.trim() || busyRef.current) return
    voice.interrupt()
    const text = input
    setInput('')
    try { await runTurn(text) }
    catch { setInput(text) }
  }
  function editDraft(field, value) {
    cancelTurn(); voice.interrupt()
    safePersist((state) => ({ ...state, draft: { ...state.draft, [field]: value }, recipeRequestId: id() }))
  }
  function editGroceryPlan(plan) {
    cancelTurn(); voice.interrupt(); setGroceryPreview(null)
    safePersist((state) => ({ ...state, groceryPlan: plan, groceryRequestId: id() }))
  }
  async function previewGroceries() {
    setError('')
    try {
      await queue.current
      const context = live.current
      const plan = normalizePlan(context.state.groceryPlan)
      const signature = JSON.stringify(context.state.groceryPlan)
      const result = await latestKitchen.current.request('/groceries/preview', { method: 'POST', body: plan })
      if (live.current !== context || signature !== JSON.stringify(context.state.groceryPlan)) return
      setGroceryPreview({ ...result, planSignature: signature })
    } catch (failure) { setError(readableError(failure)); throw failure }
  }
  async function approval(work) {
    if (busyRef.current) return
    voice.interrupt(); cancelTurn()
    busyRef.current = true; setBusy(true); setError(''); setNotice('')
    const context = live.current
    try { await queue.current; await work(context) }
    catch (failure) { if (live.current === context) setError(readableError(failure)); throw failure }
    finally { if (live.current === context) { busyRef.current = false; setBusy(false) } }
  }
  async function approveRecipe() {
    try { await approval(async (context) => {
      const source = context.state.draft
      const recipe = normalizeRecipe(source)
      const saved = await latestKitchen.current.request('/recipes/approve', { method: 'POST', body: { approved: true, requestId: context.state.recipeRequestId, recipe } })
      if (live.current !== context) return
      latestKitchen.current.replaceRecipe(saved)
      await persist((state) => ({ ...state, draft: state.draft === source ? null : state.draft, recipeRequestId: state.draft === source ? id() : state.recipeRequestId }))
      setNotice(`${saved.title} saved to ${latestKitchen.current.isGuest ? 'this device' : 'your cookbook'}.`)
    }) } catch { /* errors remain visible; preserve stable request id for retry */ }
  }
  async function approveGroceries() {
    try { await approval(async (context) => {
      const source = context.state.groceryPlan
      if (!groceryPreview || groceryPreview.planSignature !== JSON.stringify(source)) throw new Error('Preview this grocery plan again before approving.')
      if (groceryPreview.warnings.length) throw new Error('Resolve the inventory warnings before approving.')
      const plan = normalizePlan(source)
      const saved = await latestKitchen.current.request('/groceries/approve', { method: 'POST', body: { ...plan, approved: true, requestId: context.state.groceryRequestId, fingerprint: groceryPreview.fingerprint } })
      if (live.current !== context) return
      latestKitchen.current.replaceList(saved)
      await persist((state) => ({ ...state, groceryPlan: state.groceryPlan === source ? null : state.groceryPlan, groceryRequestId: state.groceryPlan === source ? id() : state.groceryRequestId }))
      setGroceryPreview(null); setNotice(`${saved.name} saved to ${latestKitchen.current.isGuest ? 'this device' : 'your groceries'}.`)
    }) } catch { /* preserve proposal and request id for retry */ }
  }
  async function saveMemory(memory) {
    cancelTurn(); voice.interrupt()
    try {
      const validated = memorySchema.parse(memory)
      await persist((state) => ({ ...state, ...explicitMemoryUpdate(state, validated), messages: [...state.messages, { id: id(), role: 'event', content: 'Memory updated' }].slice(-60) }), { optimistic: false })
    } catch (failure) { setError(readableError(failure)); throw failure }
  }
  async function forgetMemory() {
    voice.end(); cancelTurn(); setGroceryPreview(null)
    await persist((state) => ({ ...state, ...explicitMemoryUpdate(state, { facts: [], narrative: '' }), summary: '', messages: [], draft: null, groceryPlan: null, manual: null, recipeRequestId: id(), groceryRequestId: id() }))
    setNotice('Personal memory and conversation history were cleared.')
  }
  async function clearConversation() {
    voice.end(); cancelTurn(); setGroceryPreview(null)
    await persist((state) => ({ ...state, ...explicitMemoryUpdate(state, state.memory), messages: [], summary: '', draft: null, groceryPlan: null, recipeRequestId: id(), groceryRequestId: id() }))
    setNotice('Conversation cleared. Personal memory kept.')
  }
  function setMode(mode) {
    if (mode !== 'chat' && mode !== 'manual') return
    voice.end(); cancelTurn()
    safePersist((state) => ({ ...state, mode }))
    window.dispatchEvent(new CustomEvent('tally:assistant-mode', { detail: { mode } }))
  }
  function setManual(manual) {
    safePersist((state) => ({
      ...state,
      manual: {
        ...manual,
        recipeRequestId: JSON.stringify(state.manual?.recipe) !== JSON.stringify(manual.recipe) ? id() : manual.recipeRequestId,
        groceryRequestId: JSON.stringify(state.manual?.groceries) !== JSON.stringify(manual.groceries) ? id() : manual.groceryRequestId,
      },
    }))
  }
  async function approveManualRecipe() {
    await approval(async (context) => {
      const manual = context.state.manual || defaultManual()
      const saved = await latestKitchen.current.request('/recipes/approve', { method: 'POST', body: { approved: true, requestId: manual.recipeRequestId, recipe: normalizeRecipe(manual.recipe) } })
      if (live.current !== context) return
      latestKitchen.current.replaceRecipe(saved)
      await persist((state) => ({ ...state, manual: state.manual?.recipeRequestId === manual.recipeRequestId
        ? { ...state.manual, kind: 'choose', step: 0, recipe: defaultManual().recipe, recipeRequestId: id() } : state.manual }))
      setNotice(`${saved.title} saved. No AI was used.`)
    })
  }
  async function approveManualGroceries() {
    await approval(async (context) => {
      const manual = context.state.manual || defaultManual()
      const saved = await latestKitchen.current.request('/lists/manual', { method: 'POST', body: { approved: true, requestId: manual.groceryRequestId, name: manual.groceries.name, text: manual.groceries.text } })
      if (live.current !== context) return
      latestKitchen.current.replaceList(saved)
      await persist((state) => ({ ...state, manual: state.manual?.groceryRequestId === manual.groceryRequestId
        ? { ...state.manual, kind: 'choose', step: 0, groceries: { name: '', text: '' }, groceryRequestId: id() } : state.manual }))
      setNotice(`${saved.name} saved. No AI was used.`)
    })
  }
  const state = ready ? snapshot.state : emptyAssistantState()
  return {
    ready, state, messages: state.messages, draft: state.draft, groceryPlan: state.groceryPlan,
    input, setInput, send, busy, error, notice, voice, memoryOpen, setMemoryOpen,
    editDraft, editGroceryPlan, previewGroceries, groceryPreview, approveRecipe, approveGroceries,
    dismissDraft: () => { voice.interrupt(); cancelTurn(); safePersist((current) => ({ ...current, draft: null, recipeRequestId: id() })) },
    correctMessage: async (messageId, text) => {
      setGroceryPreview(null)
      if (voice.active) return voice.correct(text, messageId)
      return runTurn(text, true, messageId)
    },
    saveMemory, forgetMemory, clearConversation,
    setMemoryEnabled: (enabled) => { voice.interrupt(); cancelTurn(); safePersist((current) => ({ ...current, enabled })) },
    mode: state.mode, setMode, manual: state.manual || defaultManual(), setManual,
    approveManualRecipe, approveManualGroceries,
  }
}
