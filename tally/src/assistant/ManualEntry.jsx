import { useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, Plus, ShoppingBasket, X } from '../icons.jsx'
import './ManualEntry.css'

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
      <div className="manual-heading">
        <div>
          <h2>Manual entry</h2>
        </div>
        {current.kind !== 'choose' && (
          <button type="button" className="text-button manual-back-link" onClick={() => patch({ kind: 'choose', step: 0 })} data-testid="button-manual-back-to-choices">
            <ArrowLeft size={17} /> All entries
          </button>
        )}
      </div>
      {error && <p className="manual-error" role="alert">{error}</p>}
      {notice && <p className="manual-notice" role="status"><Check size={16} />{notice}</p>}

      {current.kind === 'choose' && (
        <div className="manual-choices">
          <button type="button" className="button button-primary button-full manual-start-button" onClick={startRecipe} data-testid="button-manual-recipe">
            <BookOpen size={19} /> New recipe
          </button>
          <button type="button" className="button button-secondary button-full manual-start-button" onClick={startGroceries} data-testid="button-manual-groceries">
            <ShoppingBasket size={19} /> New grocery list
          </button>
        </div>
      )}

      {current.kind === 'groceries' && (
        <form className="manual-groceries" onSubmit={saveGroceries}>
          <div className="manual-section-heading">
            <span className="manual-step-count">LIST</span>
            <div><h3>Start with a name</h3><p>Each nonempty line becomes one grocery item.</p></div>
          </div>
          <label className="field-label manual-field">
            List name
            <input value={groceries.name || ''} onChange={(event) => patchGroceries({ name: event.target.value })} required maxLength="120" placeholder="This week’s groceries" data-testid="input-manual-list-name" />
          </label>
          <label className="field-label manual-field">
            Items
            <textarea value={groceries.text || ''} onChange={(event) => patchGroceries({ text: event.target.value })} required rows="9" placeholder={'lemons\noat milk\nrolled oats'} data-testid="input-manual-list-items" />
          </label>
          <p className="manual-helper">Keep one item on each line. Blank lines are ignored. Nothing is sent to AI.</p>
          <button type="submit" className="button button-primary button-full" disabled={busy || saving}>{busy || saving ? 'Saving list…' : 'Save grocery list'}</button>
        </form>
      )}

      {current.kind === 'recipe' && (
        <>
          <div className="manual-wizard-progress" aria-label={`Recipe step ${current.step + 1} of 4`}>
            {['Details', 'Ingredients', 'Method', 'Review'].map((label, index) => (
              <div className={`manual-progress-step ${index <= current.step ? 'is-current' : ''}`} key={label}>
                <span>{index + 1}</span><small>{label}</small>
              </div>
            ))}
          </div>
          {current.step === 0 && (
            <form className="manual-recipe-form" onSubmit={goNext}>
              <div className="manual-section-heading"><span className="manual-step-count">01</span><div><h3>Recipe details</h3><p>Start with what you call this dish.</p></div></div>
              <label className="field-label manual-field">Recipe name<input autoFocus value={recipe.title || ''} onChange={(event) => patchRecipe({ title: event.target.value })} required maxLength="180" placeholder="Lemon olive oil cake" data-testid="input-manual-recipe-title" /></label>
              <label className="field-label manual-field">Description <span className="manual-optional">Optional</span><textarea rows="3" value={recipe.description || ''} onChange={(event) => patchRecipe({ description: event.target.value })} placeholder="A short note about the dish" /></label>
              <div className="manual-recipe-numbers">
                <label className="field-label manual-field">Servings<input type="number" min="1" step="1" value={recipe.servings ?? ''} onChange={(event) => patchRecipe({ servings: event.target.value })} required /></label>
                <label className="field-label manual-field">Prep min <span className="manual-optional">Optional</span><input type="number" min="0" step="1" value={recipe.prepMinutes ?? ''} onChange={(event) => patchRecipe({ prepMinutes: event.target.value })} /></label>
                <label className="field-label manual-field">Cook min <span className="manual-optional">Optional</span><input type="number" min="0" step="1" value={recipe.cookMinutes ?? ''} onChange={(event) => patchRecipe({ cookMinutes: event.target.value })} /></label>
              </div>
              <div className="manual-actions"><button type="submit" className="button button-primary button-full">Next: ingredients <ArrowRight size={17} /></button></div>
            </form>
          )}

          {current.step === 1 && (
            <form className="manual-recipe-form" onSubmit={goNext}>
              <div className="manual-section-heading"><span className="manual-step-count">02</span><div><h3>Ingredients</h3><p>Keep amounts and units with each ingredient.</p></div></div>
              <div className="manual-ingredients">
                {(recipe.ingredients || []).map((ingredient, index) => (
                  <div className="manual-ingredient-row" key={`manual-ingredient-${index}`}>
                    <label className="field-label manual-field ingredient-name">Ingredient<input aria-label={`Ingredient ${index + 1}`} value={ingredient.name || ''} onChange={(event) => patchRecipe({ ingredients: recipe.ingredients.map((item, i) => i === index ? { ...item, name: event.target.value } : item) })} required placeholder="Ingredient" /></label>
                    <label className="field-label manual-field ingredient-amount">Amount<input aria-label={`Amount for ingredient ${index + 1}`} type="number" min="0.0001" step="any" value={ingredient.amount ?? ''} onChange={(event) => patchRecipe({ ingredients: recipe.ingredients.map((item, i) => i === index ? { ...item, amount: event.target.value } : item) })} required placeholder="1" /></label>
                    <label className="field-label manual-field ingredient-unit">Unit<input aria-label={`Unit for ingredient ${index + 1}`} value={ingredient.unit || ''} onChange={(event) => patchRecipe({ ingredients: recipe.ingredients.map((item, i) => i === index ? { ...item, unit: event.target.value } : item) })} required placeholder="cup" /></label>
                    {recipe.ingredients.length > 1 && <button type="button" className="manual-remove-row" aria-label={`Remove ingredient ${index + 1}`} onClick={() => patchRecipe({ ingredients: recipe.ingredients.filter((_, i) => i !== index) })}><X size={17} /></button>}
                  </div>
                ))}
              </div>
              <button type="button" className="text-button manual-add-row" onClick={() => patchRecipe({ ingredients: [...recipe.ingredients, { name: '', amount: '', unit: '' }] })}><Plus size={16} /> Add ingredient</button>
              <div className="manual-actions">
                <button type="submit" className="button button-primary button-full">Next: method <ArrowRight size={17} /></button>
                <button type="button" className="button button-secondary button-full" onClick={() => patch({ step: 0 })}><ArrowLeft size={17} /> Back</button>
              </div>
            </form>
          )}

          {current.step === 2 && (
            <form className="manual-recipe-form" onSubmit={goNext}>
              <div className="manual-section-heading"><span className="manual-step-count">03</span><div><h3>Method</h3><p>Write one clear step at a time.</p></div></div>
              <ol className="manual-method-list">
                {(recipe.steps || []).map((step, index) => (
                  <li className="manual-method-row" key={`manual-step-${index}`}>
                    <span className="manual-method-number">{String(index + 1).padStart(2, '0')}</span>
                    <label className="field-label manual-field"><span className="manual-sr-only">Method step {index + 1}</span><textarea rows="3" value={step || ''} onChange={(event) => patchRecipe({ steps: recipe.steps.map((item, i) => i === index ? event.target.value : item) })} required placeholder="What happens next?" /></label>
                    {recipe.steps.length > 1 && <button type="button" className="manual-remove-row" aria-label={`Remove step ${index + 1}`} onClick={() => patchRecipe({ steps: recipe.steps.filter((_, i) => i !== index) })}><X size={17} /></button>}
                  </li>
                ))}
              </ol>
              <button type="button" className="text-button manual-add-row" onClick={() => patchRecipe({ steps: [...recipe.steps, ''] })}><Plus size={16} /> Add step</button>
              <label className="field-label manual-field manual-notes-field">Notes <span className="manual-optional">Optional</span><textarea rows="3" value={recipe.notes || ''} onChange={(event) => patchRecipe({ notes: event.target.value })} placeholder="A substitution or detail for next time" /></label>
              <div className="manual-actions">
                <button type="submit" className="button button-primary button-full">Review recipe <ArrowRight size={17} /></button>
                <button type="button" className="button button-secondary button-full" onClick={() => patch({ step: 1 })}><ArrowLeft size={17} /> Back</button>
              </div>
            </form>
          )}

          {current.step === 3 && (
            <div className="manual-review">
              <div className="manual-section-heading"><span className="manual-step-count">04</span><div><h3>Review your recipe</h3><p>Nothing is saved until you choose Save recipe.</p></div></div>
              <article className="manual-recipe-review">
                <h4>{recipe.title || 'Untitled recipe'}</h4>
                {recipe.description && <p>{recipe.description}</p>}
                <div className="recipe-meta manual-review-meta"><span>{recipe.servings || '—'} servings</span>{recipe.prepMinutes && <span>{recipe.prepMinutes} min prep</span>}{recipe.cookMinutes && <span>{recipe.cookMinutes} min cook</span>}</div>
                <section><h5>Ingredients</h5><ul className="manual-review-ingredients">{(recipe.ingredients || []).map((ingredient, index) => <li className="ingredient-display-row" key={`review-ingredient-${index}`}><span>{ingredient.name}</span><strong>{[ingredient.amount, ingredient.unit].filter(Boolean).join(' ')}</strong></li>)}</ul></section>
                <section><h5>Method</h5><ol className="method-list">{(recipe.steps || []).map((step, index) => <li key={`review-step-${index}`}><span className="step-number">{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol></section>
                {recipe.notes && <p className="recipe-note manual-review-notes">{recipe.notes}</p>}
              </article>
              <div className="manual-actions">
                <button type="button" className="button button-primary button-full" onClick={saveRecipe} disabled={busy || saving}>{busy || saving ? 'Saving recipe…' : <><Check size={17} /> Save recipe</>}</button>
                <button type="button" className="button button-secondary button-full" onClick={() => patch({ step: 2 })}><ArrowLeft size={17} /> Back</button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default ManualEntry
