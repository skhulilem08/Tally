import { app } from './app.js'
import { pool, migrate } from './db.js'
import { logger } from './logger.js'

await migrate()
const port = Number(process.env.PORT) || 3001
// Development serves the Vite UI on non-API paths too, so Preview remains valid
// whichever listener its existing forwarding configuration selects.
const host = '0.0.0.0'
const server = app.listen(port, host, () => logger.info({ port, host }, 'Tally API is ready'))
async function shutdown() {
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}
process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)
