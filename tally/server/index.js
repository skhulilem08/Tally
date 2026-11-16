import { app } from './app.js'
import { pool, migrate } from './db.js'
import { logger } from './logger.js'

await migrate()
const port = Number(process.env.PORT) || 3001
const server = app.listen(port, '0.0.0.0', () => logger.info({ port }, 'Tally API is ready'))
async function shutdown() {
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}
process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)
