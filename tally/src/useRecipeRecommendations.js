import { useEffect, useState } from 'react'
import { activityKey, readRecipeActivity, recommendRecipes, RECIPE_ACTIVITY_EVENT } from './recipeActivity.js'

export function useRecipeRecommendations(recipes, owner) {
  const [state, setState] = useState(() => ({ owner, ...readRecipeActivity(localStorage, owner) }))
  useEffect(() => {
    const update = () => setState({ owner, ...readRecipeActivity(localStorage, owner) })
    const onStorage = (event) => { if (event.key === activityKey(owner) || event.key === null) update() }
    update()
    window.addEventListener('storage', onStorage)
    window.addEventListener(RECIPE_ACTIVITY_EVENT, update)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(RECIPE_ACTIVITY_EVENT, update)
    }
  }, [owner])
  const current = state.owner === owner ? state : { opens: {}, error: '' }
  return { recommendations: recommendRecipes(recipes, current.opens), activityError: current.error }
}
