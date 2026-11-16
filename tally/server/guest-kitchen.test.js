import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createGuestApi, GUEST_STORAGE_KEY } from '../src/guestKitchen.js'

function setup() {
  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  return { storage, values, api: createGuestApi(storage) }
}
const recipe = () => ({
  title: 'Guest bean pot', description: '', servings: 2,
  ingredients: [{ name: 'Beans', amount: 300, unit: 'g' }],
  steps: ['Simmer until ready.'], notes: '',
})
const approveRecipe = (api, requestId = randomUUID()) => api('/recipes/approve', {
  method: 'POST', body: { recipe: recipe(), approved: true, requestId },
})

test('guest recipes persist across API instances and support edit/delete', async () => {
  const { api, storage } = setup()
  const requestId = randomUUID()
  const saved = await approveRecipe(api, requestId)
  assert.equal((await approveRecipe(api, requestId)).id, saved.id)
  const reopened = createGuestApi(storage)
  assert.equal((await reopened('/bootstrap')).recipes.length, 1)
  await reopened(`/recipes/${saved.id}`, { method: 'PUT', body: { recipe: { ...recipe(), title: 'Updated beans' } } })
  assert.equal((await api('/bootstrap')).recipes[0].title, 'Updated beans')
  await reopened(`/recipes/${saved.id}`, { method: 'DELETE' })
  assert.equal((await api('/bootstrap')).recipes.length, 0)
})

test('guest grocery approval, quantities and checked state persist without cloud writes', async () => {
  const { api, storage } = setup()
  const saved = await approveRecipe(api)
  const plan = { selections: [{ recipeId: saved.id, servings: 4 }], inventory: [{ name: 'beans', amount: 200, unit: 'g' }] }
  const preview = await api('/groceries/preview', { method: 'POST', body: plan })
  assert.equal((await api('/bootstrap')).lists.length, 0)
  assert.equal(preview.items[0].amount, 400)
  const body = { ...plan, name: 'Guest shopping', fingerprint: preview.fingerprint, approved: true, requestId: randomUUID() }
  const list = await api('/groceries/approve', { method: 'POST', body })
  assert.equal((await api('/groceries/approve', { method: 'POST', body })).id, list.id)
  await api(`/lists/${list.id}/items/${list.items[0].id}`, { method: 'PATCH', body: { checked: true } })
  assert.equal((await createGuestApi(storage)('/bootstrap')).lists[0].items[0].checked, true)
  await api(`/lists/${list.id}`, { method: 'DELETE' })
  assert.equal((await api('/bootstrap')).lists.length, 0)
})

test('guest approval rejects stale previews and incompatible inventory', async () => {
  const { api } = setup()
  const saved = await approveRecipe(api)
  const plan = { selections: [{ recipeId: saved.id, servings: 4 }], inventory: [] }
  const preview = await api('/groceries/preview', { method: 'POST', body: plan })
  await api(`/recipes/${saved.id}`, { method: 'PUT', body: { recipe: { ...recipe(), servings: 3 } } })
  await assert.rejects(api('/groceries/approve', { method: 'POST', body: {
    ...plan, name: 'Stale', approved: true, requestId: randomUUID(), fingerprint: preview.fingerprint,
  } }), (error) => error.status === 409)
  const badPlan = { ...plan, inventory: [{ name: 'Beans', amount: 1, unit: 'count' }] }
  const badPreview = await api('/groceries/preview', { method: 'POST', body: badPlan })
  assert.equal(badPreview.warnings.length, 1)
  await assert.rejects(api('/groceries/approve', { method: 'POST', body: {
    ...badPlan, name: 'Incompatible', approved: true, requestId: randomUUID(), fingerprint: badPreview.fingerprint,
  } }), (error) => error.status === 422)
})

test('invalid approvals and corrupt or full storage fail without destroying existing data', async () => {
  const { api, storage, values } = setup()
  await assert.rejects(api('/recipes/approve', { method: 'POST', body: { recipe: recipe(), approved: false, requestId: randomUUID() } }))
  assert.equal(values.has(GUEST_STORAGE_KEY), false)
  values.set(GUEST_STORAGE_KEY, 'corrupt')
  await assert.rejects(approveRecipe(api), /could not be read/)
  assert.equal(values.get(GUEST_STORAGE_KEY), 'corrupt')
  values.delete(GUEST_STORAGE_KEY)
  await approveRecipe(api)
  const before = values.get(GUEST_STORAGE_KEY)
  storage.setItem = () => { throw new Error('Quota exceeded') }
  await assert.rejects(approveRecipe(api), /Could not save/)
  assert.equal(values.get(GUEST_STORAGE_KEY), before)
})

test('separate browsers do not share guest records and cloud-only features never silently fall back', async () => {
  const one = setup()
  const two = setup()
  await approveRecipe(one.api)
  assert.equal((await two.api('/bootstrap')).recipes.length, 0)
  await assert.rejects(one.api('/assistant', { method: 'POST', body: {} }), (error) => error.status === 401)
})
