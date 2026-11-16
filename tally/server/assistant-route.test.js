import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { createAssistantRouter } from './assistant-route.js'

async function fixture(t, options = {}) {
  const calls = []
  const app = express()
  app.use(express.json())
  app.use('/api/assistant', createAssistantRouter({
    reply: async (input) => { calls.push(input); return { reply: 'A recipe draft, not saved.', draft: null } },
    identify: (req) => req.get('x-test-owner') || null,
    ...options,
  }))
  app.use((error, _req, res, _next) => res.status(error.name === 'ZodError' ? 400 : 500).json({ error: 'Invalid input' }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections() }))
  const url = `http://127.0.0.1:${server.address().port}/api/assistant`
  const send = (body = { messages: [{ role: 'user', content: 'My recipe serves two.' }] }, headers = {}) => fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  })
  return { calls, send }
}

test('guests can get a stateless reply without an account and responses are not cached', async (t) => {
  const { calls, send } = await fixture(t)
  const response = await send()
  assert.equal(response.status, 200)
  assert.match(response.headers.get('cache-control'), /no-store/)
  assert.equal((await response.json()).draft, null)
  assert.equal(calls.length, 1)
})

test('invalid and cross-site messages never reach the AI provider', async (t) => {
  const { calls, send } = await fixture(t)
  assert.equal((await send({ messages: [] })).status, 400)
  assert.equal((await send(undefined, { origin: 'https://unrelated.example' })).status, 403)
  assert.equal((await send(undefined, { 'sec-fetch-site': 'cross-site' })).status, 403)
  assert.equal(calls.length, 0)
})

test('anonymous usage is bounded separately from authenticated accounts', async (t) => {
  const { calls, send } = await fixture(t, { limit: 1 })
  assert.equal((await send()).status, 200)
  assert.equal((await send()).status, 429)
  assert.equal((await send(undefined, { 'x-test-owner': 'account-one' })).status, 200)
  assert.equal((await send(undefined, { 'x-test-owner': 'account-one' })).status, 429)
  assert.equal((await send(undefined, { 'x-test-owner': 'account-two' })).status, 200)
  assert.equal(calls.length, 3)
})
