import test from 'node:test'
import assert from 'node:assert/strict'
import { activityKey, readRecipeActivity, recordRecipeOpen, recommendRecipes } from '../src/recipeActivity.js'

const one = '11111111-1111-4111-8111-111111111111'
const two = '22222222-2222-4222-8222-222222222222'
const three = '33333333-3333-4333-8333-333333333333'
const setup = () => {
  const values = new Map()
  return { values, storage: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } }
}

test('opening counts persist and stay separate between guest and accounts', () => {
  const { storage } = setup()
  recordRecipeOpen(storage, 'guest', one, 100)
  recordRecipeOpen(storage, 'guest', one, 200)
  recordRecipeOpen(storage, 'account-one', two, 300)
  assert.equal(readRecipeActivity(storage, 'guest').opens[one].count, 2)
  assert.equal(readRecipeActivity(storage, 'account-one').opens[one], undefined)
  assert.deepEqual(readRecipeActivity(storage, 'account-two').opens, {})
})

test('recommendations rank actual opened recipes, never deleted or unopened records', () => {
  const { storage } = setup()
  recordRecipeOpen(storage, 'guest', one, 100)
  recordRecipeOpen(storage, 'guest', one, 200)
  recordRecipeOpen(storage, 'guest', two, 300)
  recordRecipeOpen(storage, 'guest', three, 400)
  const { opens } = readRecipeActivity(storage, 'guest')
  assert.deepEqual(recommendRecipes([{ id: two }, { id: one }], opens).map((row) => row.recipe.id), [one, two])
  assert.deepEqual(recommendRecipes([{ id: two }, { id: three }], opens).map((row) => row.recipe.id), [three, two])
  assert.deepEqual(recommendRecipes([{ id: one }], {}), [])
  assert.deepEqual(recommendRecipes([], opens), [])
})

test('corrupt or blocked recommendation storage is reported without overwriting it', () => {
  const { storage, values } = setup()
  values.set(activityKey('guest'), 'corrupt')
  assert.ok(recordRecipeOpen(storage, 'guest', one).error)
  assert.equal(values.get(activityKey('guest')), 'corrupt')
  values.clear()
  storage.setItem = () => { throw new Error('Full') }
  assert.ok(recordRecipeOpen(storage, 'guest', one).error)
  assert.deepEqual(readRecipeActivity(storage, 'guest').opens, {})
})
