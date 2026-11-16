export const RECIPE_ACTIVITY_EVENT = 'tally-recipe-open'
export const activityKey = (owner) => `tally-recipe-opens:${owner}`
const unavailable = 'Recipe recommendations are unavailable on this device.'

export function readRecipeActivity(storage, owner) {
  try {
    const raw = storage.getItem(activityKey(owner))
    if (raw === null) return { opens: {}, error: '' }
    const value = JSON.parse(raw)
    if (value?.version !== 1 || !value.opens || Array.isArray(value.opens) || typeof value.opens !== 'object') throw new Error()
    for (const [id, entry] of Object.entries(value.opens)) {
      if (!/^[a-f0-9-]{36}$/i.test(id) || !Number.isSafeInteger(entry?.count) || entry.count < 1 ||
          !Number.isFinite(entry.lastOpenedAt) || entry.lastOpenedAt < 0) throw new Error()
    }
    return { opens: value.opens, error: '' }
  } catch {
    return { opens: {}, error: unavailable }
  }
}

export function recordRecipeOpen(storage, owner, recipeId, openedAt = Date.now()) {
  const current = readRecipeActivity(storage, owner)
  if (current.error) return current
  if (!/^[a-f0-9-]{36}$/i.test(recipeId)) return { ...current, error: unavailable }
  const previous = current.opens[recipeId]
  const opens = { ...current.opens, [recipeId]: {
    count: Math.min((previous?.count || 0) + 1, Number.MAX_SAFE_INTEGER),
    lastOpenedAt: openedAt,
  } }
  try {
    storage.setItem(activityKey(owner), JSON.stringify({ version: 1, opens }))
    return { opens, error: '' }
  } catch {
    return { ...current, error: unavailable }
  }
}

export function recommendRecipes(recipes, opens, limit = 3) {
  return recipes
    .filter((recipe) => opens[recipe.id]?.count > 0)
    .map((recipe) => ({ recipe, openCount: opens[recipe.id].count, lastOpenedAt: opens[recipe.id].lastOpenedAt }))
    .sort((a, b) => b.openCount - a.openCount || b.lastOpenedAt - a.lastOpenedAt || a.recipe.id.localeCompare(b.recipe.id))
    .slice(0, limit)
}
