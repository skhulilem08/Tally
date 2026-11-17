import { useEffect, useState } from 'react'
import { Check, Plus, X } from '../icons.jsx'
import { useAssistant } from './useAssistant.js'
import { memoryMarkdown } from '../../shared/assistant-state.js'
import './MemorySettings.css'

const blankFact = () => ({ label: '', value: '' })

function MemorySettings({ kitchen }) {
  const assistant = useAssistant(kitchen)
  const [editing, setEditing] = useState(false)
  const [facts, setFacts] = useState([])
  const [narrative, setNarrative] = useState('')
  const [confirmAction, setConfirmAction] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!assistant.ready) return
    setFacts((assistant.state.memory?.facts || []).map((fact) => ({ ...fact })))
    setNarrative(assistant.state.memory?.narrative || '')
  }, [assistant.ready, assistant.state.memory])

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await assistant.saveMemory({
        facts: facts.filter((fact) => fact.label.trim() || fact.value.trim()),
        narrative,
      })
      setEditing(false)
    } catch {
      // Keep entered details intact if persistence fails.
    } finally {
      setSaving(false)
    }
  }

  const confirm = async () => {
    try {
      if (confirmAction === 'forget') await assistant.forgetMemory()
      if (confirmAction === 'clear') await assistant.clearConversation()
      setConfirmAction('')
      setEditing(false)
    } catch {
      // The hook exposes the failure; the confirmation stays available to retry.
    }
  }

  const download = () => {
    const markdown = memoryMarkdown({
      facts: assistant.state.memory?.facts || [],
      narrative: assistant.state.memory?.narrative || '',
    })
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'tally-memory.md'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const updateFact = (index, key, value) => {
    setFacts((current) => current.map((fact, i) => i === index ? { ...fact, [key]: value } : fact))
  }

  return (
    <section className="memory-settings" aria-label="Assistant memory settings">
      {assistant.error && <p className="memory-settings-error" role="alert">{assistant.error}</p>}
      {assistant.notice && <p className="memory-settings-notice" role="status"><Check size={16} />{assistant.notice}</p>}
      {!assistant.ready && !assistant.error && (
        <div className="memory-settings-skeleton" aria-label="Loading Assistant memory"><span /><span /><span /></div>
      )}
      {assistant.ready && (
        <>
          <label className="memory-settings-toggle">
            <span><strong>Use personal memory</strong><small>Allow saved details to inform future AI conversations.</small></span>
            <input type="checkbox" checked={assistant.state.enabled} onChange={(event) => assistant.setMemoryEnabled(event.target.checked)} data-testid="toggle-settings-assistant-memory" />
          </label>

          {editing ? (
            <form className="memory-settings-form" onSubmit={save}>
              <label className="memory-settings-field">Preferences and context
                <textarea rows="4" value={narrative} onChange={(event) => setNarrative(event.target.value)} placeholder="Details you want Tally to keep in mind" data-testid="input-settings-memory-narrative" />
              </label>
              <div className="memory-settings-subhead"><h3>Remembered details</h3><span>{facts.length}</span></div>
              {facts.map((fact, index) => (
                <div className="memory-settings-fact" key={`memory-fact-${index}`}>
                  <label><span className="memory-settings-sr-only">Topic {index + 1}</span><input value={fact.label} maxLength="80" onChange={(event) => updateFact(index, 'label', event.target.value)} placeholder="Topic" required /></label>
                  <label><span className="memory-settings-sr-only">Detail {index + 1}</span><input value={fact.value} maxLength="500" onChange={(event) => updateFact(index, 'value', event.target.value)} placeholder="Detail" required /></label>
                  <button type="button" className="memory-settings-icon-action" aria-label={`Remove remembered detail ${index + 1}`} onClick={() => setFacts((current) => current.filter((_, i) => i !== index))} data-testid={`button-remove-memory-fact-${index}`}><X size={17} /></button>
                </div>
              ))}
              <button type="button" className="memory-settings-text-action" onClick={() => setFacts((current) => [...current, blankFact()])} data-testid="button-add-memory-fact"><Plus size={16} /> Add detail</button>
              <div className="memory-settings-actions">
                <button type="button" className="memory-settings-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="memory-settings-primary" disabled={saving}>{saving ? 'Saving…' : 'Save memory'}</button>
              </div>
            </form>
          ) : (
            <>
              <section className="memory-settings-section">
                <div className="memory-settings-subhead"><h3>Remembered details</h3><span>{assistant.state.memory?.facts?.length || 0}</span></div>
                {assistant.state.memory?.narrative && <p className="memory-settings-narrative">{assistant.state.memory.narrative}</p>}
                {(assistant.state.memory?.facts || []).length ? (
                  <ul className="memory-settings-list">
                    {assistant.state.memory.facts.map((fact, index) => <li key={`${fact.label}-${index}`}><strong>{fact.label}</strong><span>{fact.value}</span></li>)}
                  </ul>
                ) : !assistant.state.memory?.narrative && <p className="memory-settings-empty">Nothing saved yet. Details you ask Tally to remember will appear here.</p>}
              </section>
              <div className="memory-settings-actions memory-settings-actions-wrap">
                <button type="button" className="memory-settings-secondary" onClick={() => setEditing(true)} data-testid="button-edit-settings-memory">Edit memory</button>
                <button type="button" className="memory-settings-secondary" onClick={download} data-testid="button-download-memory">Download memory.md</button>
              </div>
              <div className="memory-settings-danger-actions">
                <button type="button" className="memory-settings-danger-text" onClick={() => setConfirmAction('clear')} data-testid="button-settings-clear-conversation">Clear conversation</button>
                <button type="button" className="memory-settings-danger-text" onClick={() => setConfirmAction('forget')} data-testid="button-settings-forget-everything">Forget everything</button>
              </div>
              <p className="memory-settings-footnote">{kitchen.isGuest ? 'Assistant memory and history stay on this device.' : 'Assistant memory and history are private to your signed-in account.'} Chat context is sent to online AI when you speak with Tally.</p>
            </>
          )}
        </>
      )}

      {confirmAction && (
        <section className="memory-settings-confirm" role="alertdialog" aria-labelledby="memory-confirm-title" aria-describedby="memory-confirm-description">
          <span className="memory-settings-overline">{confirmAction === 'forget' ? 'Permanent action' : 'Conversation control'}</span>
          <h3 id="memory-confirm-title">{confirmAction === 'forget' ? 'Forget everything?' : 'Clear conversation?'}</h3>
          <p id="memory-confirm-description">{confirmAction === 'forget'
            ? 'This permanently clears memory, transcript, summary, and Assistant drafts.'
            : 'This clears the transcript, summary, recipe proposal, and grocery plan. Personal memory stays.'}</p>
          <button type="button" className="memory-settings-danger" onClick={confirm} disabled={assistant.busy} data-testid="button-confirm-settings-memory-action">
            {confirmAction === 'forget' ? 'Forget memory and history' : 'Clear conversation'}
          </button>
          <button type="button" className="memory-settings-secondary memory-settings-cancel" onClick={() => setConfirmAction('')}><X size={16} /> Cancel</button>
        </section>
      )}
    </section>
  )
}

export default MemorySettings
