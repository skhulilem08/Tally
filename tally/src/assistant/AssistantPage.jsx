import { useEffect, useRef, useState } from 'react'
import { Link } from 'wouter'
import {
  BookOpen, Check, CheckCircle2, Plus, ShoppingBasket, X,
} from '../icons.jsx'
import { useAssistantControls } from './preferences.js'
import { useAssistant } from './useAssistant.js'
import ManualEntry from './ManualEntry.jsx'
import './AssistantPage.css'

function AssistantPage({ kitchen }) {
  const a = useAssistant(kitchen)
  const [controls] = useAssistantControls()
  const feedRef = useRef(null)
  const [correctionId, setCorrectionId] = useState(null)
  const [correctionText, setCorrectionText] = useState('')
  const [draftExpanded, setDraftExpanded] = useState(false)
  const [groceryExpanded, setGroceryExpanded] = useState(false)
  const [previewShown, setPreviewShown] = useState(false)

  const latestRecipe = kitchen.recipes?.[0]
  const latestList = kitchen.lists?.[0]
  const draft = a.draft
  const groceryPlan = a.groceryPlan
  const voice = a.voice
  const messages = a.messages || []

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [messages, a.busy, draft, a.groceryPreview, voice?.status])

  const updatePlan = (next) => {
    a.editGroceryPlan(next)
    setPreviewShown(false)
  }

  const updateSelection = (recipeId, checked) => {
    const current = groceryPlan?.selections || []
    if (checked) {
      const recipe = kitchen.recipes.find((item) => String(item.id) === String(recipeId))
      if (!recipe || current.some((selection) => String(selection.recipeId) === String(recipe.id))) return
      updatePlan({ ...groceryPlan, selections: [...current, { recipeId: recipe.id, servings: recipe.servings || 2 }] })
    } else {
      updatePlan({ ...groceryPlan, selections: current.filter((selection) => String(selection.recipeId) !== String(recipeId)) })
    }
  }

  const updateInventory = (index, key, value) => {
    const inventory = [...(groceryPlan?.inventory || [])]
    inventory[index] = { ...inventory[index], [key]: value }
    updatePlan({ ...groceryPlan, inventory })
  }

  const handlePreview = async () => {
    try {
      await a.previewGroceries()
      setPreviewShown(true)
    } catch {
      // The hook surfaces the failure through its shared error state.
    }
  }

  const beginCorrection = (message) => {
    setCorrectionId(message.id)
    setCorrectionText(message.content)
  }

  const submitCorrection = async (event) => {
    event.preventDefault()
    if (!correctionText.trim()) return
    try {
      await a.correctMessage(correctionId, correctionText.trim())
      setCorrectionId(null)
    } catch {
      // Preserve the edited text so the correction can be retried.
    }
  }

  const voiceLabel = {
    idle: 'Voice is off',
    requesting: 'Waiting for microphone permission',
    listening: 'Listening',
    transcribing: 'Working out what you said',
    thinking: 'Tally is thinking',
    speaking: 'Tally is speaking',
    muted: 'Microphone muted',
    error: 'Voice call needs attention',
  }[voice?.status] || 'Voice is off'

  return (
    <div className="assistant-screen" aria-labelledby="assistant-title">
      <header className="cookbook-native-header assistant-native-header">
        <Link
          href={latestRecipe ? `/cookbook/${latestRecipe.id}` : '/cookbook'}
          className="assistant-header-link"
          aria-label={latestRecipe ? `Cookbook, latest recipe ${latestRecipe.title}` : 'Open cookbook'}
          data-testid="link-assistant-cookbook"
        >
          <BookOpen size={22} />
        </Link>
        <h1 id="assistant-title">Assistant</h1>
        <Link
          href={latestList ? `/groceries/${latestList.id}` : '/groceries'}
          className="assistant-header-link"
          aria-label={latestList ? `Groceries, latest list ${latestList.name}` : 'Open groceries'}
          data-testid="link-assistant-groceries"
        >
          <ShoppingBasket size={22} />
        </Link>
      </header>

      {controls !== 'longpress' && <div className="assistant-toolbar">
        <div className="assistant-mode-switch" role="group" aria-label="Assistant mode">
          <button type="button" aria-pressed={a.mode === 'chat'} onClick={() => a.setMode('chat')} data-testid="button-assistant-chat-mode">Chat</button>
          <button type="button" aria-pressed={a.mode === 'manual'} onClick={() => a.setMode('manual')} data-testid="button-assistant-manual-mode">Manual</button>
        </div>
      </div>}

      <div className="assistant-chat-view" hidden={a.mode === 'manual'}>
      <section className="assistant-call" aria-label="Live voice conversation">
        <div className="assistant-call-copy">
          <span className={`assistant-call-indicator ${voice?.active ? 'is-active' : ''}`} aria-hidden="true" />
          <div>
            <strong>{voice?.active || voice?.status === 'error' ? voiceLabel : 'Talk to Tally'}</strong>
            {voice?.error && <p>{voice.error}</p>}
          </div>
        </div>
        {!voice?.active ? (
          <button type="button" className="assistant-voice-start" onClick={() => voice?.start()} disabled={!a.ready || a.busy} data-testid="button-start-voice">
            Start voice
          </button>
        ) : (
          <div className="assistant-call-controls">
            <button type="button" className="assistant-call-control" onClick={() => voice.toggleMute()} aria-pressed={Boolean(voice.muted)} data-testid="button-toggle-mute">
              {voice.muted ? 'Unmute' : 'Mute'}
            </button>
            <button type="button" className="assistant-call-control" onClick={() => voice.interrupt()} data-testid="button-interrupt-voice">
              Interrupt
            </button>
            <button type="button" className="assistant-call-end" onClick={() => voice.end()} data-testid="button-end-voice">
              End call
            </button>
          </div>
        )}
      </section>
      <details className="assistant-info-details">
        <summary>Voice &amp; privacy</summary>
        <p>Tally’s voice is AI-generated. ElevenLabs recognizes and speaks each turn; Replit OpenAI processes the conversation and relevant recipe details. There is a processing pause between turns. Tally does not retain raw audio; provider retention policies apply. Guest history and memory save on this device. Account history and memory save privately to your account. Calls end when you leave the page or after 15 minutes.</p>
      </details>

      <section className="assistant-conversation" aria-label="Conversation with Tally">
        <div className="assistant-feed" ref={feedRef} aria-live="polite" aria-relevant="additions text">
          {!a.ready && (
            <div className="assistant-skeleton" aria-label="Loading assistant">
              <span /><span /><span />
            </div>
          )}
          {messages.map((message, index) => message.role === 'event' ? (
            <div className="assistant-memory-event" key={message.id || `event-${index}`} role="status">
              <CheckCircle2 size={16} /> <span>{message.content}</span>
            </div>
          ) : (
            <article className={`assistant-message assistant-message-${message.role}`} key={message.id || `${message.role}-${index}`} data-testid={`message-${message.role}-${message.id || index}`}>
              <div className="assistant-message-topline">
                <span>{message.role === 'assistant' ? 'Tally' : 'You'}</span>
                {message.spoken && <span className="assistant-spoken-label">Voice</span>}
                {message.role === 'user' && message.spoken && message.id && correctionId !== message.id && (
                  <button type="button" onClick={() => beginCorrection(message)} className="assistant-correct-button" data-testid={`button-correct-message-${message.id}`}>Correct</button>
                )}
              </div>
              {correctionId === message.id ? (
                <form className="assistant-correction-form" onSubmit={submitCorrection}>
                  <label className="assistant-sr-only" htmlFor={`correct-${message.id}`}>Correct your message</label>
                  <textarea id={`correct-${message.id}`} value={correctionText} onChange={(event) => setCorrectionText(event.target.value)} rows="3" data-testid={`input-correct-message-${message.id}`} />
                  <div>
                    <button type="button" className="assistant-quiet-action" onClick={() => setCorrectionId(null)}>Cancel</button>
                    <button type="submit" className="assistant-inline-primary" disabled={!correctionText.trim() || a.busy}>Correct &amp; continue</button>
                  </div>
                </form>
              ) : <p>{message.content}</p>}
            </article>
          ))}
          {a.busy && <div className="assistant-thinking" role="status"><span /><span /><span /> <span className="assistant-sr-only">Tally is thinking</span></div>}
          {draft && (
            <article className="assistant-proposal">
              <div className="assistant-proposal-heading">
                <div>
                  <span className="assistant-overline">Recipe draft · not saved</span>
                  <h2>{draft.title || 'Untitled recipe'}</h2>
                </div>
                <button type="button" className="assistant-small-action" onClick={() => a.dismissDraft()} aria-label="Dismiss recipe draft" data-testid="button-dismiss-recipe-draft"><X size={18} /></button>
              </div>
              {draft.description && <p className="assistant-proposal-description">{draft.description}</p>}
              <div className="assistant-recipe-summary">
                <span>{draft.servings || '—'} servings</span>
                {(draft.prepMinutes || draft.cookMinutes) && <span>{[draft.prepMinutes && `${draft.prepMinutes} min prep`, draft.cookMinutes && `${draft.cookMinutes} min cook`].filter(Boolean).join(' · ')}</span>}
              </div>
              <ul className="assistant-mini-ingredients">
                {(draft.ingredients || []).slice(0, draftExpanded ? undefined : 3).map((item, index) => <li key={`${item.name}-${index}`}><span>{item.name || 'Ingredient'}</span><strong>{[item.amount, item.unit].filter(Boolean).join(' ')}</strong></li>)}
              </ul>
              {!draftExpanded && (draft.ingredients || []).length > 3 && <p className="assistant-more-count">+{draft.ingredients.length - 3} more ingredients</p>}
              {draftExpanded && (
                <div className="assistant-draft-editor">
                  <label>Recipe name<input value={draft.title || ''} onChange={(event) => a.editDraft('title', event.target.value)} data-testid="input-draft-title" /></label>
                  <label>Description<textarea rows="2" value={draft.description || ''} onChange={(event) => a.editDraft('description', event.target.value)} data-testid="input-draft-description" /></label>
                  <div className="assistant-draft-numbers">
                    <label>Servings<input type="number" min="1" value={draft.servings ?? ''} onChange={(event) => a.editDraft('servings', event.target.value)} /></label>
                    <label>Prep min<input type="number" min="0" value={draft.prepMinutes ?? ''} onChange={(event) => a.editDraft('prepMinutes', event.target.value)} /></label>
                    <label>Cook min<input type="number" min="0" value={draft.cookMinutes ?? ''} onChange={(event) => a.editDraft('cookMinutes', event.target.value)} /></label>
                  </div>
                  <h3>Ingredients</h3>
                  {(draft.ingredients || []).map((item, index) => (
                    <div className="assistant-edit-row" key={`draft-ingredient-${index}`}>
                      <input aria-label={`Ingredient ${index + 1}`} value={item.name || ''} placeholder="Name" onChange={(event) => a.editDraft('ingredients', draft.ingredients.map((entry, i) => i === index ? { ...entry, name: event.target.value } : entry))} />
                      <input aria-label={`Amount ${index + 1}`} type="number" min="0" step="any" value={item.amount ?? ''} placeholder="Amount" onChange={(event) => a.editDraft('ingredients', draft.ingredients.map((entry, i) => i === index ? { ...entry, amount: event.target.value } : entry))} />
                      <input aria-label={`Unit ${index + 1}`} value={item.unit || ''} placeholder="Unit" onChange={(event) => a.editDraft('ingredients', draft.ingredients.map((entry, i) => i === index ? { ...entry, unit: event.target.value } : entry))} />
                      <button type="button" className="assistant-row-remove" aria-label={`Remove ingredient ${index + 1}`} onClick={() => a.editDraft('ingredients', draft.ingredients.filter((_, i) => i !== index))}><X size={16} /></button>
                    </div>
                  ))}
                  <button type="button" className="assistant-text-action" onClick={() => a.editDraft('ingredients', [...(draft.ingredients || []), { name: '', amount: '', unit: '' }])}><Plus size={15} /> Add ingredient</button>
                  <h3>Method</h3>
                  {(draft.steps || []).map((step, index) => <label className="assistant-step-edit" key={`draft-step-${index}`}><span>{index + 1}</span><textarea rows="2" aria-label={`Method step ${index + 1}`} value={step} onChange={(event) => a.editDraft('steps', draft.steps.map((value, i) => i === index ? event.target.value : value))} /></label>)}
                  <button type="button" className="assistant-text-action" onClick={() => a.editDraft('steps', [...(draft.steps || []), ''])}><Plus size={15} /> Add step</button>
                  <label>Notes<textarea rows="2" value={draft.notes || ''} onChange={(event) => a.editDraft('notes', event.target.value)} /></label>
                </div>
              )}
              <div className="assistant-proposal-actions">
                <button type="button" className="assistant-inline-primary" onClick={() => a.approveRecipe()} disabled={a.busy} data-testid="button-approve-recipe"><Check size={17} /> Approve &amp; Save</button>
                <button type="button" className="assistant-small-action" onClick={() => setDraftExpanded((expanded) => !expanded)} data-testid="button-edit-recipe-draft">{draftExpanded ? 'Done editing' : 'Review & edit'}</button>
                <button type="button" className="assistant-small-action" onClick={() => { setDraftExpanded(false); voice?.start() }}>Continue by voice</button>
              </div>
            </article>
          )}
          {groceryPlan && (
            <article className="assistant-proposal assistant-grocery-proposal">
              <div className="assistant-proposal-heading">
                <div>
                  <span className="assistant-overline">Grocery plan · not saved</span>
                  <h2>{groceryPlan.name || 'Shopping plan'}</h2>
                </div>
                <button type="button" className="assistant-small-action" onClick={() => setGroceryExpanded((expanded) => !expanded)} data-testid="button-edit-grocery-plan">{groceryExpanded ? 'Close' : 'Edit plan'}</button>
              </div>
              {!groceryExpanded ? (
                <p className="assistant-proposal-description">{(groceryPlan.selections || []).length} {(groceryPlan.selections || []).length === 1 ? 'recipe' : 'recipes'} selected · review the plan and preview before saving.</p>
              ) : (
                <div className="assistant-grocery-editor">
                  <label className="assistant-grocery-name">List name<input value={groceryPlan.name || ''} onChange={(event) => updatePlan({ ...groceryPlan, name: event.target.value })} /></label>
                  <h3>Recipes</h3>
                  {kitchen.recipes.length ? kitchen.recipes.map((recipe) => {
                    const selection = (groceryPlan.selections || []).find((item) => String(item.recipeId) === String(recipe.id))
                    return <div className="assistant-recipe-select-row" key={recipe.id}>
                      <label><input type="checkbox" checked={Boolean(selection)} onChange={(event) => updateSelection(recipe.id, event.target.checked)} /><span>{recipe.title}</span></label>
                      {selection && <label className="assistant-serving-count">Serves<input aria-label={`Servings for ${recipe.title}`} type="number" min="1" value={selection.servings ?? ''} onChange={(event) => updatePlan({ ...groceryPlan, selections: groceryPlan.selections.map((item) => String(item.recipeId) === String(recipe.id) ? { ...item, servings: event.target.value } : item) })} /></label>}
                    </div>
                  }) : <p className="assistant-proposal-description">Save a recipe first, or ask Tally to draft one.</p>}
                  <h3>Already have</h3>
                  {(groceryPlan.inventory || []).map((item, index) => <div className="assistant-edit-row" key={`inventory-${index}`}>
                    <input aria-label={`Pantry item ${index + 1}`} placeholder="Ingredient" value={item.name || ''} onChange={(event) => updateInventory(index, 'name', event.target.value)} />
                    <input aria-label={`Pantry amount ${index + 1}`} type="number" min="0" step="any" placeholder="Amount" value={item.amount ?? ''} onChange={(event) => updateInventory(index, 'amount', event.target.value)} />
                    <input aria-label={`Pantry unit ${index + 1}`} placeholder="Unit" value={item.unit || ''} onChange={(event) => updateInventory(index, 'unit', event.target.value)} />
                    <button type="button" className="assistant-row-remove" aria-label={`Remove pantry item ${index + 1}`} onClick={() => updatePlan({ ...groceryPlan, inventory: groceryPlan.inventory.filter((_, i) => i !== index) })}><X size={16} /></button>
                  </div>)}
                  <button type="button" className="assistant-text-action" onClick={() => updatePlan({ ...groceryPlan, inventory: [...(groceryPlan.inventory || []), { name: '', amount: '', unit: '' }] })}><Plus size={15} /> Add what you have</button>
                </div>
              )}
              <div className="assistant-proposal-actions">
                <button type="button" className="assistant-inline-secondary" onClick={handlePreview} disabled={a.busy || !(groceryPlan.selections || []).length} data-testid="button-preview-groceries">Preview groceries</button>
                <button type="button" className="assistant-inline-primary" onClick={() => a.approveGroceries()} disabled={a.busy || !previewShown || !a.groceryPreview} data-testid="button-approve-groceries"><Check size={17} /> Approve &amp; Save</button>
              </div>
              {previewShown && a.groceryPreview && (
                <div className="assistant-grocery-preview" aria-label="Grocery list preview">
                  <h3>Preview · {a.groceryPreview.items?.length || 0} items</h3>
                  <ul className="assistant-mini-ingredients">
                    {(a.groceryPreview.items || []).map((item) => <li key={item.id}><span>{item.name}</span><strong>{item.amount} {item.unit}</strong></li>)}
                  </ul>
                  {!a.groceryPreview.items?.length && <p className="assistant-preview-note">Nothing to buy from this plan. Confirm that the reported pantry quantities are still accurate.</p>}
                  {(a.groceryPreview.warnings || []).length > 0 && <div className="assistant-grocery-warnings"><strong>Check these assumptions</strong>{a.groceryPreview.warnings.map((warning, index) => <p key={`warning-${index}`}>{typeof warning === 'string' ? warning : warning.message || warning.name || 'Review an ingredient quantity.'}</p>)}</div>}
                  <p className="assistant-preview-note">Nothing is added to your grocery history until you approve this list.</p>
                </div>
              )}
            </article>
          )}
          {a.notice && <p className="assistant-inline-notice" role="status"><CheckCircle2 size={16} />{a.notice}</p>}
        </div>

        {a.error && <div className="assistant-error" role="alert">{a.error}</div>}
      </section>
      </div>

      <div className="assistant-manual-view" hidden={a.mode !== 'manual'}>
        <ManualEntry
          manual={a.manual}
          setManual={a.setManual}
          approveRecipe={a.approveManualRecipe}
          approveGroceries={a.approveManualGroceries}
          busy={a.busy}
          error={a.error}
          notice={a.notice}
        />
      </div>

      </div>
  )
}

export default AssistantPage
