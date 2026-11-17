import { api } from '../api.js'
import { assistantStateSchema, emptyAssistantState } from '../../shared/assistant-state.js'

export const ASSISTANT_GUEST_KEY = 'tally-guest-assistant-v1'
export function readGuestAssistant() {
  const raw = localStorage.getItem(ASSISTANT_GUEST_KEY)
  if (raw === null) return { revision: 0, state: emptyAssistantState() }
  try {
    const value = JSON.parse(raw)
    if (!Number.isSafeInteger(value.revision) || value.revision < 0) throw new Error('revision')
    return { revision: value.revision, state: assistantStateSchema.parse(value.state) }
  } catch {
    throw new Error('Your device conversation could not be read. It has not been overwritten. Check device storage before continuing.')
  }
}
export async function loadAssistant(owner) {
  if (owner === 'guest') return readGuestAssistant()
  const result = await api('/assistant/state')
  return { revision: result.revision, state: assistantStateSchema.parse(result.state) }
}
export async function storeAssistant(owner, expectedRevision, state) {
  assistantStateSchema.parse(state)
  if (owner !== 'guest') return api('/assistant/state', { method: 'PUT', body: { expectedRevision, expectedOwner: owner, state } })
  // Refuse unsafe concurrent writes rather than pretend localStorage is atomic.
  if (!navigator.locks) throw new Error('This browser does not support safe device conversation storage. Use a current Safari, Chrome or Firefox version.')
  return navigator.locks.request(ASSISTANT_GUEST_KEY, () => {
    const current = readGuestAssistant()
    if (current.revision !== expectedRevision) {
      throw new Error('Your device conversation changed in another tab. Reload before continuing.')
    }
    const result = { revision: expectedRevision + 1, state }
    try { localStorage.setItem(ASSISTANT_GUEST_KEY, JSON.stringify(result)) }
    catch { throw new Error('This device could not save the conversation. Free some storage; do not close this page before copying important changes.') }
    return result
  })
}
