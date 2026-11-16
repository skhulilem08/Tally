import { randomUUID, createHash } from 'node:crypto'
import { calculateGroceries as calculate } from '../shared/grocery-calculation.js'

export function calculateGroceries(recipes, selections, inventory) {
  return calculate(recipes, selections, inventory, {
    newId: randomUUID,
    hashInput: (value) => createHash('sha256').update(value).digest('hex'),
  })
}
