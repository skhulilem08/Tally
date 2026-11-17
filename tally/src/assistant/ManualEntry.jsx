import { useState } from 'react'
import { Check, Plus, X } from '../icons.jsx'
import KitchenAnimation from './KitchenAnimation.jsx'
import AutoTextarea from './AutoTextarea.jsx'
import './ManualEntry.css'

const RequiredMark = () => <span className="manual-required-mark" aria-hidden="true"> *</span>
const RequiredNote = () => <p className="manual-required-note"><span className="manual-required-mark" aria-hidden="true">*</span> Required fields</p>

const newRecipe = () => ({
  title: '',
  description: '',
  servings: 2,
  prepMinutes: '',
  cookMinutes: '',
  ingredients: [{ name: '', amount: '', unit: '' }],
  steps: [''],
  notes: '',
})

const newManual = () => ({
  kind: 'choose',
  step: 0,
  recipe: newRecipe(),
  groceries: { name: '', text: '' },
  recipeRequestId: '',
  groceryRequestId: '',
})

function ManualEntry({ manual, setManual, approveRecipe, approveGroceries, busy, error, notice }) {
  const current = manual || newManual()
  const [saving, setSaving] = useState(false)
  const recipe = current.recipe || newRecipe()
  const groceries = current.groceries || { name: '', text: '' }

  const patch = (values) => setManual({ ...current, ...values })
  const patchRecipe = (values) => patch({ recipe: { ...recipe, ...values } })
  const patchGroceries = (values) => patch({ groceries: { ...groceries, ...values } })

  const goNext = (event) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    patch({ step: Math.min(3, current.step + 1) })
  }

  const saveRecipe = async () => {
    setSaving(true)
    try {
      await approveRecipe()
    } catch {
      // The hook keeps the draft and exposes its save error.
    } finally {
      setSaving(false)
    }
  }

  const saveGroceries = async (event) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    setSaving(true)
    try {
      await approveGroceries()
    } catch {
      // Keep the entered name and lines so the save can be retried.
    } finally {
      setSaving(false)
    }
  }

  const startRecipe = () => patch({ kind: 'recipe', step: 0, recipe: recipe || newRecipe() })
  const startGroceries = () => patch({ kind: 'groceries', step: 0, groceries })

  return (
    <section className="manual-entry" aria-label="Manual kitchen entry">
      {error && <p className="manual-error" role="alert">{error}</p>}
      {notice && <p className="manual-notice" role="status"><Check size={16} />{notice}</p>}

      {current.kind === 'choose' && (
        <>
        <KitchenAnimation />
        <div className="manual-choices">
          <button type="button" className="button button-primary button-full manual-start-button" onClick={startRecipe} data-testid="button-manual-recipe">
            New recipe
          </button>
          <button type="button" className="button button-secondary button-full manual-start-button" onClick={startGroceries} data-testid="button-manual-groceries">
            New grocery list
          </button>
        </div>
        </>
      )}

      {current.kind === 'groceries' && (
        <form className="manual-groceries" onSubmit={saveGroceries}>
          <div className="manual-step-heading"><h2 className="manual-current-step">List details</h2><RequiredNote /></div>
          <label className="field-label manual-field">
            <span>List name<RequiredMark /></span>
            <input value={groceries.name || ''} onChange={(event) => patchGroceries({ name: event.target.value })} required maxLength="120" placeholder="This week’s groceries" data-testid="input-manual-list-name" />
          </label>
          <label className="field-label manual-field">
            <span>Items<RequiredMark /></span>
            <AutoTextarea value={groceries.text || ''} onChange={(event) => patchGroceries({ text: event.target.value })} required rows={9} placeholder={'lemons\noat milk\nrolled oats'} data-testid="input-manual-list-items" />
          </label>
          <p className="manual-helper">Keep one item on each line. Blank lines are ignored. Nothing is sent to AI.</p>
          <button type="submit" className="button button-primary button-full" disabled={busy || saving}>{busy || saving ? 'Saving list…' : 'Save grocery list'}</button>
        </form>
      )}

      {current.kind === 'recipe' && (
        <>
          <div className="manual-wizard-progress" role="progressbar" aria-label="Recipe progress" aria-valuemin={0} aria-valuemax={4} aria-valuenow={current.step + 1} aria-valuetext={['Recipe details', 'Ingredients', 'Method', 'Review your recipe'][current.step]}>
            <span style={{ transform: `scaleX(${(current.step + 1) / 4})` }} />
          </div>
          <div className="manual-step-heading">
            <h2 className="manual-current-step">{['Recipe details', 'Ingredients', 'Method', 'Review your recipe'][current.step]}</h2>
            {current.step < 3 && <RequiredNote />}
          </div>
          {current.step === 0 && (
            <form className="manual-recipe-form" onSubmit={goNext}>
              <label className="field-label manual-field"><span>Recipe name<RequiredMark /></span><input autoFocus value={recipe.title || ''} onChange={(event) => patchRecipe({ title: event.target.value })} required maxLength="160" placeholder="Lemon olive oil cake" data-testid="input-manual-recipe-title" /></label>
              <label className="field-label manual-field">Description<AutoTextarea rows={3} value={recipe.description || ''} onChange={(event) => patchRecipe({ description: event.target.value })} placeholder="A short note about the dish" /></label>
              <div className="manual-recipe-numbers">
                <label className="field-label manual-field"><span>Servings<RequiredMark /></span><input type="number" min="1" step="1" value={recipe.servings ?? ''} onChange={(event) => patchRecipe({ servings: event.target.value })} required /></label>
                <label className="field-label manual-field">Prep min<input type="number" min="0" step="1" value={recipe.prepMinutes ?? ''} onChange={(event) => patchRecipe({ prepMinutes: event.target.value })} /></label>
                <label className="field-label manual-field">Cook min<input type="number" min="0" step="1" value={recipe.cookMinutes ?? ''} onChange={(event) => patchRecipe({ cookMinutes: event.target.value })} /></label>
              </div>
              <div className="manual-actions"><button type="submit" className="button button-primary button-full">Next: ingredients</button></div>
            </form>
          )}

          {current.step === 1 && (
            <form className="manual-recipe-form" onSubmit={goNext}>
              <div className="manual-ingredients">
                {(recipe.ingredients || []).map((ingredient, index) => (
                  <div className="manual-ingredient-row" key={`manual-ingredient-${index}`}>
                    <label className="field-label manual-field ingredient-name"><span>Ingredient<RequiredMark /></span><input aria-label={`Ingredient ${index + 1}`} value={ingredient.name || ''} onChange={(event) => patchRecipe({ ingredients: recipe.ingredients.map((item, i) => i === index ? { ...item, name: event.target.value } : item) })} required placeholder="Ingredient" /></label>
                    <label className="field-label manual-field ingredient-amount"><span>Amount<RequiredMark /></span><input aria-label={`Amount for ingredient ${index + 1}`} type="number" min="0.0001" step="any" value={ingredient.amount ?? ''} onChange={(event) => patchRecipe({ ingredients: recipe.ingredients.map((item, i) => i === index ? { ...item, amount: event.target.value } : item) })} required placeholder="1" /></label>
                    <label className="field-label manual-field ingredient-unit"><span>Unit<RequiredMark /></span><input aria-label={`Unit for ingredient ${index + 1}`} value={ingredient.unit || ''} onChange={(event) => patchRecipe({ ingredients: recipe.ingredients.map((item, i) => i === index ? { ...item, unit: event.target.value } : item) })} required placeholder="cup" /></label>
                    {recipe.ingredients.length > 1 && <button type="button" className="manual-remove-row" aria-label={`Remove ingredient ${index + 1}`} onClick={() => patchRecipe({ ingredients: recipe.ingredients.filter((_, i) => i !== index) })}><X size={17} /></button>}
                  </div>
                ))}
              </div>
              <button type="button" className="text-button manual-add-row" onClick={() => patchRecipe({ ingredients: [...recipe.ingredients, { name: '', amount: '', unit: '' }] })}><Plus size={16} /> Add ingredient</button>
              <div className="manual-actions">
                <button type="submit" className="button button-primary button-full">Next: method</button>
              </div>
            </form>
          )}

          {current.step === 2 && (
            <form className="manual-recipe-form" onSubmit={goNext}>
              <ol className="manual-method-list">
                {(recipe.steps || []).map((step, index) => (
                  <li className="manual-method-row" key={`manual-step-${index}`}>
                    <span className="manual-method-number">{String(index + 1).padStart(2, '0')}</span>
                    <label className="field-label manual-field"><span>Method<RequiredMark /><span className="manual-sr-only"> step {index + 1}</span></span><AutoTextarea rows={3} value={step || ''} onChange={(event) => patchRecipe({ steps: recipe.steps.map((item, i) => i === index ? event.target.value : item) })} required placeholder="What happens next?" /></label>
                    {recipe.steps.length > 1 && <button type="button" className="manual-remove-row" aria-label={`Remove step ${index + 1}`} onClick={() => patchRecipe({ steps: recipe.steps.filter((_, i) => i !== index) })}><X size={17} /></button>}
                  </li>
                ))}
              </ol>
              <button type="button" className="text-button manual-add-row" onClick={() => patchRecipe({ steps: [...recipe.steps, ''] })}><Plus size={16} /> Add step</button>
              <label className="field-label manual-field manual-notes-field">Notes<AutoTextarea rows={3} value={recipe.notes || ''} onChange={(event) => patchRecipe({ notes: event.target.value })} placeholder="A substitution or detail for next time" /></label>
              <div className="manual-actions">
                <button type="submit" className="button button-primary button-full">Review recipe</button>
              </div>
            </form>
          )}

          {current.step === 3 && (
            <div className="manual-review">
              <article className="manual-recipe-review">
                <h4>{recipe.title || 'Untitled recipe'}</h4>
                {recipe.description && <p>{recipe.description}</p>}
                <div className="recipe-meta manual-review-meta"><span>{recipe.servings || '—'} servings</span>{recipe.prepMinutes && <span>{recipe.prepMinutes} min prep</span>}{recipe.cookMinutes && <span>{recipe.cookMinutes} min cook</span>}</div>
                <section><h5>Ingredients</h5><ul className="manual-review-ingredients">{(recipe.ingredients || []).map((ingredient, index) => <li className="ingredient-display-row" key={`review-ingredient-${index}`}><span>{ingredient.name}</span><strong>{[ingredient.amount, ingredient.unit].filter(Boolean).join(' ')}</strong></li>)}</ul></section>
                <section><h5>Method</h5><ol className="method-list">{(recipe.steps || []).map((step, index) => <li key={`review-step-${index}`}><span className="step-number">{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol></section>
                {recipe.notes && <p className="recipe-note manual-review-notes">{recipe.notes}</p>}
              </article>
              <div className="manual-actions">
                <button type="button" className="button button-primary button-full" onClick={saveRecipe} disabled={busy || saving}>{busy || saving ? 'Saving recipe…' : 'Save recipe'}</button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default ManualEntry
