import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { randomUUID } from 'node:crypto'
import { createAssistantRouter } from './assistant-route.js'
import { emptyAssistantState, memoryMarkdown, assistantStateSchema } from '../shared/assistant-state.js'
import { validateWav } from './assistant-speech.js'
import { createGuestApi } from '../src/guestKitchen.js'

async function fixture(t, options = {}) {
  const app = express()
  app.use(express.json({ limit: '256kb' }))
  app.use('/api/assistant', createAssistantRouter({
    identify: (req) => req.get('x-owner') || null,
    ...options,
  }))
  app.use((error, _req, res, _next) => res.status(error.name === 'ZodError' ? 400 : error.status || 500).json({ error: error.message }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections() }))
  return (path = '', { owner, body, ...options } = {}) => fetch(`http://127.0.0.1:${server.address().port}/api/assistant${path}`, {
    ...options, headers: { ...(owner ? { 'x-owner': owner } : {}), ...(body ? { 'content-type': 'application/json' } : {}), ...options.headers },
    body: body ? JSON.stringify(body) : options.body,
  })
}

test('memory Markdown represents canonical facts and narrative without table injection', () => {
  const markdown = memoryMarkdown({ facts: [{ label: 'Favourite | food', value: 'Beans\nand rice' }], narrative: 'Usually cooks for two.' })
  assert.match(markdown, /Favourite \\\| food/)
  assert.match(markdown, /Beans and rice/)
  assert.match(markdown, /Usually cooks for two/)
  const state = emptyAssistantState(randomUUID)
  assert.equal(assistantStateSchema.parse(state).mode, 'chat')
  assert.throws(() => assistantStateSchema.parse({ ...state, memory: { facts: [{ label: '', value: 'x' }], narrative: '' } }))
})

test('account state and memory are owner-scoped, authenticated and revision guarded', async (t) => {
  const states = new Map()
  const fetchRoute = await fixture(t, {
    load: async (owner) => states.get(owner) || { revision: 0, state: emptyAssistantState(randomUUID) },
    save: async (owner, expected, state) => {
      const current = states.get(owner)
      if ((current?.revision || 0) !== expected) throw Object.assign(new Error('Changed'), { status: 409 })
      const saved = { revision: expected + 1, state }
      states.set(owner, saved)
      return saved
    },
  })
  assert.equal((await fetchRoute('/state')).status, 401)
  assert.equal((await fetchRoute('/memory.md')).status, 401)
  const state = emptyAssistantState(randomUUID)
  state.memory.facts.push({ label: 'Favourite food', value: 'Beans' })
  const saved = await fetchRoute('/state', { owner: 'first', method: 'PUT', body: { owner: 'second', expectedRevision: 0, state } })
  assert.equal(saved.status, 200)
  assert.match(saved.headers.get('cache-control'), /no-store/)
  assert.equal((await fetchRoute('/state', { owner: 'first', method: 'PUT', body: { expectedRevision: 0, state } })).status, 409)
  const other = await (await fetchRoute('/state', { owner: 'second' })).json()
  assert.deepEqual(other.state.memory.facts, [])
  const markdown = await fetchRoute('/memory.md', { owner: 'first' })
  assert.match(await markdown.text(), /Beans/)
})

test('account replies use stored memory, not caller-injected account memory', async (t) => {
  let seen
  const state = emptyAssistantState(randomUUID)
  state.memory.narrative = 'Stored preference'
  const fetchRoute = await fixture(t, {
    load: async () => ({ revision: 4, state }),
    reply: async (input) => { seen = input; return { reply: 'Hello', draft: null } },
  })
  const body = { messages: [{ role: 'user', content: 'Hello' }], contextRevision: 4, memory: { facts: [], narrative: 'Injected' } }
  assert.equal((await fetchRoute('', { owner: 'first', method: 'POST', body })).status, 200)
  assert.equal(seen.memory.narrative, 'Stored preference')
  assert.equal((await fetchRoute('', { owner: 'first', method: 'POST', body: { ...body, contextRevision: 3 } })).status, 409)
})

test('speech routes enforce origin, size and text bounds before provider work', async (t) => {
  let calls = 0
  const fetchRoute = await fixture(t, {
    transcribe: async (bytes) => { validateWav(bytes); calls++; return { text: 'Heard words' } },
    speak: async () => { calls++; return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'audio/mpeg' } }) },
  })
  const invalid = await fetchRoute('/transcribe', { method: 'POST', headers: { 'content-type': 'audio/wav' }, body: null })
  assert.equal(invalid.status, 400)
  assert.equal((await fetchRoute('/speak', { method: 'POST', body: { text: 'Hello' }, headers: { origin: 'https://other.example' } })).status, 403)
  assert.equal((await fetchRoute('/speak', { method: 'POST', body: { text: 'x'.repeat(2201) } })).status, 400)
  assert.equal(calls, 0)
  const response = await fetchRoute('/speak', { method: 'POST', body: { text: 'Hello' } })
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /audio\/mpeg/)
  assert.equal((await response.arrayBuffer()).byteLength, 3)
  assert.equal(calls, 1)
})

test('manual device lists use each non-empty line, preserve text and retry safely', async () => {
  const data = new Map()
  const api = createGuestApi({ getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) })
  const body = { name: 'Weekend', text: '  12 eggs \r\n\n2 kg rice\nMilk', approved: true, requestId: randomUUID() }
  const saved = await api('/lists/manual', { method: 'POST', body })
  assert.deepEqual(saved.items.map((item) => item.name), ['12 eggs', '2 kg rice', 'Milk'])
  assert.equal(saved.items[0].amount, null)
  assert.equal((await api('/lists/manual', { method: 'POST', body })).id, saved.id)
  assert.equal((await api('/bootstrap')).lists.length, 1)
  await api(`/lists/${saved.id}/items/${saved.items[0].id}`, { method: 'PATCH', body: { checked: true } })
  assert.equal((await api('/bootstrap')).lists[0].items[0].checked, true)
  await assert.rejects(api('/lists/manual', { method: 'POST', body: { ...body, text: '\n  ' } }))
})
