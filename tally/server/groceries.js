import { randomUUID, createHash } from 'node:crypto'

const units = {
  g: ['g', 1], gram: ['g', 1], grams: ['g', 1],
  kg: ['g', 1000], kilogram: ['g', 1000], kilograms: ['g', 1000],
  ml: ['ml', 1], millilitre: ['ml', 1], millilitres: ['ml', 1],
  milliliter: ['ml', 1], milliliters: ['ml', 1],
  l: ['ml', 1000], litre: ['ml', 1000], litres: ['ml', 1000],
  liter: ['ml', 1000], liters: ['ml', 1000],
  count: ['count', 1], each: ['count', 1], piece: ['count', 1], pieces: ['count', 1],
}

function normalize(value) {
  return value.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/\s+/g, ' ')
}

function measurement(unit) {
  const value = normalize(unit)
  return units[value] || [value, 1]
}

/** Only compatible units and exact normalized food names are combined. */
export function calculateGroceries(recipes, selections, inventory) {
  const required = new Map()
  const warnings = new Set()
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]))
  for (const selection of selections) {
    const recipe = byId.get(selection.recipeId)
    if (!recipe) throw Object.assign(new Error('A selected recipe is no longer available.'), { status: 404 })
    for (const ingredient of recipe.ingredients) {
      const name = normalize(ingredient.name)
      const [unit, multiplier] = measurement(ingredient.unit)
      const key = `${name}\u0000${unit}`
      const row = required.get(key) || { name: ingredient.name, unit, amount: 0 }
      row.amount += ingredient.amount * multiplier * selection.servings / recipe.servings
      required.set(key, row)
    }
  }

  const onHand = new Map()
  for (const ingredient of inventory) {
    const name = normalize(ingredient.name)
    const [unit, multiplier] = measurement(ingredient.unit)
    const key = `${name}\u0000${unit}`
    onHand.set(key, (onHand.get(key) || 0) + ingredient.amount * multiplier)
    const sameFood = [...required.entries()].filter(([requiredKey]) => requiredKey.split('\u0000')[0] === name)
    if (ingredient.amount > 0 && sameFood.length && !required.has(key)) {
      warnings.add(`Convert the on-hand ${ingredient.name} from ${ingredient.unit} to ${sameFood[0][1].unit}, or remove it from this inventory report. Counts, volume, and weight cannot be assumed equivalent.`)
    }
  }

  const items = []
  for (const [key, ingredient] of required) {
    const amount = Math.max(0, ingredient.amount - (onHand.get(key) || 0))
    if (amount > 0.0000001) {
      items.push({
        id: randomUUID(),
        name: ingredient.name,
        // Round upward, not down to zero for genuinely needed small amounts.
        amount: Math.ceil((amount - 1e-10) * 10000) / 10000,
        unit: ingredient.unit,
        checked: false,
      })
    }
  }
  items.sort((a, b) => a.name.localeCompare(b.name))
  const fingerprint = createHash('sha256').update(JSON.stringify({
    recipes: [...recipes].sort((a, b) => a.id.localeCompare(b.id)),
    selections,
    inventory,
  })).digest('hex')
  return { items, warnings: [...warnings], fingerprint }
}
