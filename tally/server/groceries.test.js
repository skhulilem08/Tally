import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateGroceries } from './groceries.js'
import { recipeSchema, approvalSchema, planSchema } from './validation.js'

const recipe = {
  id: 'e24c2ffe-3ca9-4980-a264-1b87941248f1',
  title: 'Beef stew', description: '', servings: 2,
  ingredients: [{ name: 'Beef', amount: 300, unit: 'g' }],
  steps: ['Cook until tender.'], notes: '', prepMinutes: null, cookMinutes: null,
}
const selection = [{ recipeId: recipe.id, servings: 4 }]
test('blueprint: scales 300g for two to 600g for four minus 200g = 400g', () => {
  const result = calculateGroceries([recipe], selection, [{ name: 'beef', amount: 200, unit: 'g' }])
  assert.equal(result.items[0].amount, 400)
  assert.deepEqual(result.warnings, [])
})
test('kg and g combine, excess stock never produces negative groceries', () => {
  const result = calculateGroceries([recipe], selection, [{ name: 'BEEF', amount: 1, unit: 'kg' }])
  assert.deepEqual(result.items, [])
})
test('compatible inventory rows are summed', () => {
  const result = calculateGroceries([recipe], selection, [
    { name: 'beef', amount: 0.1, unit: 'kg' },
    { name: 'beef', amount: 100, unit: 'g' },
  ])
  assert.equal(result.items[0].amount, 400)
})
test('counts do not silently subtract from weight', () => {
  const result = calculateGroceries([recipe], selection, [{ name: 'Beef', amount: 2, unit: 'count' }])
  assert.equal(result.items[0].amount, 600)
  assert.equal(result.warnings.length, 1)
})
test('distinct foods are never merged by keyword', () => {
  const tomato = { ...recipe, ingredients: [{ name: 'Tomato paste', amount: 50, unit: 'g' }] }
  const result = calculateGroceries([tomato], selection, [{ name: 'Tomato', amount: 100, unit: 'g' }])
  assert.equal(result.items[0].amount, 100)
})
test('combines equivalent food across selected recipes', () => {
  const second = { ...recipe, id: 'e24c2ffe-3ca9-4980-a264-1b87941248f2' }
  const result = calculateGroceries([recipe, second], [
    { recipeId: recipe.id, servings: 2 }, { recipeId: second.id, servings: 2 },
  ], [])
  assert.equal(result.items.length, 1)
  assert.equal(result.items[0].amount, 600)
})
test('missing or unauthorized recipes fail explicitly', () => {
  assert.throws(() => calculateGroceries([], selection, []), /no longer available/)
})
test('new lists get independent item identities and checks', () => {
  const a = calculateGroceries([recipe], selection, []).items[0]
  const b = calculateGroceries([recipe], selection, []).items[0]
  a.checked = true
  assert.notEqual(a.id, b.id)
  assert.equal(b.checked, false)
})
test('rejects missing or invalid quantities and requires approval', () => {
  assert.equal(recipeSchema.safeParse({ ...recipe, servings: 0 }).success, false)
  assert.equal(recipeSchema.safeParse({ ...recipe, ingredients: [{ name: 'Beef', unit: 'g' }] }).success, false)
  assert.equal(approvalSchema.safeParse({ recipe, approved: false, requestId: recipe.id }).success, false)
})
test('rejects duplicate meal selections and negative inventory', () => {
  assert.equal(planSchema.safeParse({ selections: [...selection, ...selection], inventory: [] }).success, false)
  assert.equal(planSchema.safeParse({ selections: selection, inventory: [{ name: 'Beef', amount: -1, unit: 'g' }] }).success, false)
})
test('does not convert cups to weight or invent densities', () => {
  const result = calculateGroceries([recipe], selection, [{ name: 'Beef', amount: 2, unit: 'cups' }])
  assert.equal(result.warnings.length, 1)
  assert.equal(result.items[0].amount, 600)
})
test('preview fingerprint is stable but changes if the reviewed recipe changes', () => {
  const before = calculateGroceries([recipe], selection, [])
  const retry = calculateGroceries([recipe], selection, [])
  const changed = calculateGroceries([{ ...recipe, servings: 3 }], selection, [])
  assert.equal(before.fingerprint, retry.fingerprint)
  assert.notEqual(before.fingerprint, changed.fingerprint)
})
