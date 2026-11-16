import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const cwd = fileURLToPath(new URL('../', import.meta.url))
const args = process.argv.slice(2)
const portIndex = args.indexOf('--port')
const webPort = Number(portIndex >= 0 ? args[portIndex + 1] : process.env.PORT) || 5173
const web = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...args], {
  cwd, stdio: 'inherit',
})
let api
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  api?.kill('SIGTERM')
  web.kill('SIGTERM')
  setTimeout(() => process.exit(code), 1000).unref()
}
// Replit forwards the first opened port by default. Wait for the UI listener
// before opening the internal API, rather than depending on process startup races.
async function startApi() {
  for (let attempt = 0; attempt < 100 && !stopping; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${webPort}/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(500),
      })
      if (response.ok) {
        if (stopping) return
        api = spawn(process.execPath, ['--watch', 'server/index.js'], {
          cwd, stdio: 'inherit', env: { ...process.env, PORT: '3001', TALLY_FRONTEND_PORT: String(webPort) },
        })
        api.on('exit', (code) => stop(code || 0))
        api.on('error', (error) => { console.error(error); stop(1) })
        return
      }
    } catch { /* Vite has not started listening yet. */ }
    await delay(100)
  }
  if (!stopping) {
    console.error('Tally frontend did not start; refusing to expose the API as Preview.')
    stop(1)
  }
}
void startApi()
web.on('error', (error) => { console.error(error); stop(1) })
web.on('exit', (code) => stop(code || 0))
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
