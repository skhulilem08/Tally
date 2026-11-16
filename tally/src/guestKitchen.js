import { z } from 'zod'
import { approvalSchema, recipeSchema, planSchema, listApprovalSchema } from '../server/validation.js'
import { calculateGroceries } from '../shared/grocery-calculation.js'

export const GUEST_STORAGE_KEY = 'tally-guest-kitchen-v1'
const storedRecipe = recipeSchema.extend({
  id: z.string().uuid(), createdAt: z.string(), updatedAt: z.string().optional(),
})
const storedList = z.object({
  id: z.string().uuid(), name: z.string(), createdAt: z.string(),
  items: z.array(z.object({
    id: z.string().uuid(), name: z.string(), amount: z.number().finite().positive(),
    unit: z.string(), checked: z.boolean(),
  })),
}).passthrough()
const storeSchema = z.object({
  version: z.literal(1), recipes: z.array(storedRecipe), lists: z.array(storedList),
  recipeRequests: z.record(z.string(), z.string()), listRequests: z.record(z.string(), z.string()),
})
const fresh = () => ({ version: 1, recipes: [], lists: [], recipeRequests: {}, listRequests: {} })
const fail = (message, status = 400) => Object.assign(new Error(message), { status })
const uuid = () => globalThis.crypto.randomUUID()
const now = () => new Date().toISOString()
async function sha256(value) {
  const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createGuestApi(storage) {
  const read = () => {
    let raw
    try { raw = storage.getItem(GUEST_STORAGE_KEY) } catch {
      throw fail('Device storage is unavailable. Allow site storage to use your guest kitchen.')
    }
    if (raw === null) return fresh()
    try { return storeSchema.parse(JSON.parse(raw)) } catch {
      throw fail('Your guest kitchen could not be read. Existing device data has not been changed.')
    }
  }
  const save = (data) => {
    try { storage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data)) } catch {
      throw fail('Could not save on this device. Storage may be full or blocked; your changes have not been saved.')
    }
  }
  const preview = async (data, body) => {
    const input = planSchema.parse(body)
    const recipes = data.recipes.filter((recipe) => input.selections.some((row) => row.recipeId === recipe.id))
    const result = calculateGroceries(recipes, input.selections, input.inventory)
    result.fingerprint = await sha256(result.fingerprint)
    return result
  }
  return async (path, { method = 'GET', body } = {}) => {
    try {
      const data = read()
      if (path === '/bootstrap' && method === 'GET') return { recipes: data.recipes, lists: data.lists }
      if (path === '/recipes/approve' && method === 'POST') {
        const input = approvalSchema.parse(body)
        const existing = data.recipes.find((recipe) => recipe.id === data.recipeRequests[input.requestId])
        if (existing) return existing
        const recipe = { ...input.recipe, id: uuid(), createdAt: now() }
        data.recipes.unshift(recipe)
        data.recipeRequests[input.requestId] = recipe.id
        save(data)
        return recipe
      }
      const recipeRoute = path.match(/^\/recipes\/([^/]+)$/)
      if (recipeRoute) {
        const index = data.recipes.findIndex((recipe) => recipe.id === recipeRoute[1])
        if (index < 0) throw fail('Recipe not found on this device.', 404)
        if (method === 'PUT') {
          const recipe = { ...data.recipes[index], ...recipeSchema.parse(body?.recipe), updatedAt: now() }
          data.recipes[index] = recipe
          save(data)
          return recipe
        }
        if (method === 'DELETE') {
          data.recipes.splice(index, 1)
          save(data)
          return { ok: true }
        }
      }
      if (path === '/groceries/preview' && method === 'POST') return await preview(data, body)
      if (path === '/groceries/approve' && method === 'POST') {
        const input = listApprovalSchema.parse(body)
        const existing = data.lists.find((list) => list.id === data.listRequests[input.requestId])
        if (existing) return existing
        const result = await preview(data, input)
        // Web Locks serialize browser writes. Also detect external storage changes
        // while Web Crypto is running, instead of overwriting another tab's data.
        if (JSON.stringify(read()) !== JSON.stringify(data)) throw fail('Your guest kitchen changed. Preview this list again.', 409)
        if (result.fingerprint !== input.fingerprint) throw fail('A recipe changed. Preview the list again before saving.', 409)
        if (result.warnings.length) throw fail('Resolve the inventory unit warnings before saving.', 422)
        const list = { ...result, id: uuid(), name: input.name, selections: input.selections, inventory: input.inventory, createdAt: now() }
        data.lists.unshift(list)
        data.listRequests[input.requestId] = list.id
        save(data)
        return list
      }
      const itemRoute = path.match(/^\/lists\/([^/]+)\/items\/([^/]+)$/)
      if (itemRoute && method === 'PATCH') {
        const list = data.lists.find((record) => record.id === itemRoute[1])
        const item = list?.items.find((record) => record.id === itemRoute[2])
        if (!item) throw fail('Grocery item not found on this device.', 404)
        item.checked = z.boolean().parse(body?.checked)
        save(data)
        return list
      }
      const listRoute = path.match(/^\/lists\/([^/]+)$/)
      if (listRoute && method === 'DELETE') {
        const index = data.lists.findIndex((list) => list.id === listRoute[1])
        if (index < 0) throw fail('List not found on this device.', 404)
        data.lists.splice(index, 1)
        save(data)
        return { ok: true }
      }
      throw fail('This operation is not available in device storage.', 404)
    } catch (error) {
      if (error instanceof z.ZodError) throw fail(`Check your entry: ${error.issues[0]?.message || 'Invalid value.'}`)
      throw error
    }
  }
}

export function guestApi(path, options) {
  const run = () => createGuestApi(window.localStorage)(path, options)
  return navigator.locks?.request ? navigator.locks.request(GUEST_STORAGE_KEY, run) : run()
}
