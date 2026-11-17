import { randomUUID } from 'node:crypto'
import { pool } from './db.js'
import { emptyAssistantState, memoryMarkdown } from '../shared/assistant-state.js'

export async function loadAssistantState(ownerId) {
  const result = await pool.query('SELECT revision, data FROM tally_assistant_states WHERE owner_id = $1', [ownerId])
  return result.rowCount
    ? { revision: result.rows[0].revision, state: result.rows[0].data }
    : { revision: 0, state: emptyAssistantState(randomUUID) }
}

export async function saveAssistantState(ownerId, expectedRevision, state) {
  const result = await pool.query(
    expectedRevision === 0
      ? `INSERT INTO tally_assistant_states(owner_id, revision, data, memory_markdown)
     SELECT $1, 1, $3, $4 WHERE $2 = 0
     ON CONFLICT(owner_id) DO NOTHING RETURNING revision, data`
      : `UPDATE tally_assistant_states SET revision = revision + 1, data = $3,
       memory_markdown = $4, updated_at = now()
       WHERE owner_id = $1 AND revision = $2 RETURNING revision, data`,
    [ownerId, expectedRevision, JSON.stringify(state), memoryMarkdown(state.memory)],
  )
  if (!result.rowCount) throw Object.assign(new Error('This conversation changed in another tab. Reload it before making more changes.'), { status: 409 })
  return { revision: result.rows[0].revision, state: result.rows[0].data }
}
