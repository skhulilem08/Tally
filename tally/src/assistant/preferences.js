import { useSyncExternalStore } from 'react'

const key = 'tally-assistant-controls'
const eventName = 'tally:assistant-controls'
const choices = ['visible', 'longpress', 'both']
const read = () => {
  const value = localStorage.getItem(key)
  return choices.includes(value) ? value : 'both'
}
const subscribe = (notify) => {
  const storage = (event) => { if (event.key === key) notify() }
  window.addEventListener('storage', storage)
  window.addEventListener(eventName, notify)
  return () => {
    window.removeEventListener('storage', storage)
    window.removeEventListener(eventName, notify)
  }
}
export function useAssistantControls() {
  const value = useSyncExternalStore(subscribe, read, () => 'both')
  return [value, (next) => {
    if (!choices.includes(next)) throw new Error('Choose a supported Assistant control.')
    localStorage.setItem(key, next)
    window.dispatchEvent(new Event(eventName))
  }]
}
