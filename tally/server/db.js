import pg from 'pg'
import { readFile } from 'node:fs/promises'

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 8,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})
export async function migrate() {
  await pool.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'))
}
export function record(row) {
  return {
    ...row.data,
    id: row.id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
