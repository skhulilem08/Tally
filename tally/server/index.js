import { app } from './app.js'
import { pool, migrate } from './db.js'
import { logger } from './logger.js'

await migrate()
const port = Number(process.env.PORT) || 3001
// In development only Vite is public; it proxies /api to this private listener.
// Exposing both listeners can make Preview select the API instead of the UI.
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'
const server = app.listen(port, host, () => logger.info({ port, host }, 'Tally API is ready'))
async function shutdown() {
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}
process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)
