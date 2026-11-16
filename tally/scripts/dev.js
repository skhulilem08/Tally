import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const cwd = fileURLToPath(new URL('../', import.meta.url))
const api = spawn(process.execPath, ['--watch', 'server/index.js'], {
  cwd, stdio: 'inherit', env: { ...process.env, PORT: '3001' },
})
const web = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)], {
  cwd, stdio: 'inherit',
})
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  api.kill('SIGTERM')
  web.kill('SIGTERM')
  setTimeout(() => process.exit(code), 1000).unref()
}
api.on('exit', (code) => stop(code || 0))
web.on('exit', (code) => stop(code || 0))
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
