import express from 'express'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pinoHttp from 'pino-http'
import { clerkMiddleware, getAuth } from '@clerk/express'
import { publishableKeyFromHost } from '@clerk/shared/keys'
import { rateLimit } from 'express-rate-limit'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { z } from 'zod'
import { pool, record } from './db.js'
import { logger } from './logger.js'
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from './clerk-proxy.js'
import { approvalSchema, recipeSchema, planSchema, listApprovalSchema, assistantSchema } from './validation.js'
import { calculateGroceries } from './groceries.js'
import { assistantReply } from './assistant.js'

export const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(pinoHttp({
  logger,
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url?.split('?')[0] }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
}))
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware())
app.use(express.json({ limit: '256kb' }))
app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ ok: true })
})
app.use(clerkMiddleware((req) => ({
  publishableKey: publishableKeyFromHost(
    getClerkProxyHost(req) ?? '',
    process.env.CLERK_PUBLISHABLE_KEY,
  ),
})))

const router = express.Router()
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('Vary', 'Cookie')
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Sign in to access your private kitchen.' })
  req.ownerId = userId
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.headers.origin
    const host = getClerkProxyHost(req)
    const allowed = new Set([host, req.headers.host, ...(process.env.REPLIT_DOMAINS || '').split(',')])
    // The browser-test/dev proxy can preserve a public Host while the real
    // browser origin is the local Vite listener. Never allow these in production.
    if (process.env.NODE_ENV !== 'production') {
      allowed.add('localhost:5000')
      allowed.add('127.0.0.1:5000')
    }
    if (req.headers['sec-fetch-site'] === 'cross-site') {
      return res.status(403).json({ error: 'Open Tally directly to make this change.' })
    }
    if (origin) {
      try {
        if (!allowed.has(new URL(origin).host)) return res.status(403).json({ error: 'Request origin is not allowed.' })
      } catch {
        return res.status(403).json({ error: 'Invalid request origin.' })
      }
    }
  }
  next()
})
router.use(rateLimit({
  windowMs: 60000, limit: 180,
  keyGenerator: (req) => req.ownerId,
  standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a minute and try again.' },
}))

const validId = (id) => z.string().uuid().parse(id)
async function ownerRecipes(ownerId, ids) {
  const result = await pool.query(
    'SELECT * FROM tally_recipes WHERE owner_id = $1 AND id = ANY($2::uuid[])',
    [ownerId, ids],
  )
  return result.rows.map(record)
}

router.get('/bootstrap', async (req, res) => {
  const [recipes, lists] = await Promise.all([
    pool.query('SELECT * FROM tally_recipes WHERE owner_id = $1 ORDER BY created_at DESC', [req.ownerId]),
    pool.query('SELECT * FROM tally_grocery_lists WHERE owner_id = $1 ORDER BY created_at DESC', [req.ownerId]),
  ])
  res.json({ recipes: recipes.rows.map(record), lists: lists.rows.map(record) })
})

router.post('/recipes/approve', async (req, res) => {
  const { recipe, requestId } = approvalSchema.parse(req.body)
  const result = await pool.query(
    `INSERT INTO tally_recipes (id, owner_id, request_id, data) VALUES ($1, $2, $3, $4)
     ON CONFLICT (owner_id, request_id) DO UPDATE SET request_id = EXCLUDED.request_id RETURNING *`,
    [randomUUID(), req.ownerId, requestId, JSON.stringify(recipe)],
  )
  res.status(201).json(record(result.rows[0]))
})

router.put('/recipes/:id', async (req, res) => {
  const id = validId(req.params.id)
  const { recipe } = z.object({ recipe: recipeSchema }).parse(req.body)
  const result = await pool.query(
    'UPDATE tally_recipes SET data = $1, updated_at = now() WHERE id = $2 AND owner_id = $3 RETURNING *',
    [JSON.stringify(recipe), id, req.ownerId],
  )
  if (!result.rowCount) return res.status(404).json({ error: 'Recipe not found.' })
  res.json(record(result.rows[0]))
})

router.delete('/recipes/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM tally_recipes WHERE id = $1 AND owner_id = $2 RETURNING id', [validId(req.params.id), req.ownerId])
  if (!result.rowCount) return res.status(404).json({ error: 'Recipe not found.' })
  res.json({ ok: true })
})

router.post('/assistant', rateLimit({
  windowMs: 300000, limit: 20,
  keyGenerator: (req) => req.ownerId,
  message: { error: 'Give your kitchen assistant a moment. Please try again shortly.' },
}), async (req, res) => {
  const input = assistantSchema.parse(req.body)
  res.json(await assistantReply(input))
})

router.post('/groceries/preview', async (req, res) => {
  const { selections, inventory } = planSchema.parse(req.body)
  const recipes = await ownerRecipes(req.ownerId, selections.map((row) => row.recipeId))
  res.json(calculateGroceries(recipes, selections, inventory))
})

router.post('/groceries/approve', async (req, res) => {
  const { name, selections, inventory, requestId, fingerprint } = listApprovalSchema.parse(req.body)
  // Retry after a response interruption returns the original approved list.
  const existing = await pool.query(
    'SELECT * FROM tally_grocery_lists WHERE owner_id = $1 AND request_id = $2',
    [req.ownerId, requestId],
  )
  if (existing.rowCount) return res.json(record(existing.rows[0]))
  const recipes = await ownerRecipes(req.ownerId, selections.map((row) => row.recipeId))
  const preview = calculateGroceries(recipes, selections, inventory)
  if (preview.fingerprint !== fingerprint) {
    return res.status(409).json({ error: 'A recipe or inventory value changed since this preview. Preview the list again before approving.' })
  }
  if (preview.warnings.length) return res.status(422).json({ error: 'Resolve the inventory unit warnings before approving this list.', warnings: preview.warnings })
  const data = { name, selections, inventory, ...preview }
  const result = await pool.query(
    `INSERT INTO tally_grocery_lists(id, owner_id, request_id, data) VALUES($1, $2, $3, $4)
     ON CONFLICT(owner_id, request_id) DO UPDATE SET request_id = EXCLUDED.request_id RETURNING *`,
    [randomUUID(), req.ownerId, requestId, JSON.stringify(data)],
  )
  res.status(201).json(record(result.rows[0]))
})

router.patch('/lists/:id/items/:itemId', async (req, res) => {
  const id = validId(req.params.id)
  const itemId = validId(req.params.itemId)
  const { checked } = z.object({ checked: z.boolean() }).parse(req.body)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query('SELECT * FROM tally_grocery_lists WHERE id = $1 AND owner_id = $2 FOR UPDATE', [id, req.ownerId])
    if (!result.rowCount) throw Object.assign(new Error('Grocery list not found.'), { status: 404 })
    const data = result.rows[0].data
    const item = data.items.find((row) => row.id === itemId)
    if (!item) throw Object.assign(new Error('Grocery item not found.'), { status: 404 })
    item.checked = checked
    const updated = await client.query(
      'UPDATE tally_grocery_lists SET data = $1, updated_at = now() WHERE id = $2 AND owner_id = $3 RETURNING *',
      [JSON.stringify(data), id, req.ownerId],
    )
    await client.query('COMMIT')
    res.json(record(updated.rows[0]))
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
})

router.delete('/lists/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM tally_grocery_lists WHERE id = $1 AND owner_id = $2 RETURNING id', [validId(req.params.id), req.ownerId])
  if (!result.rowCount) return res.status(404).json({ error: 'Grocery list not found.' })
  res.json({ ok: true })
})

router.use((_req, res) => res.status(404).json({ error: 'This API route does not exist.' }))
app.use('/api', router)

if (process.env.NODE_ENV === 'production') {
  const dist = fileURLToPath(new URL('../dist/', import.meta.url))
  app.use(express.static(dist, { maxAge: '1h', setHeaders(res, filePath) {
    if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-cache')
  } }))
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
} else {
  // Legacy Preview can retain the API port as its selected target. Serve the
  // same Vite UI there too; /api routes above remain authenticated and never
  // enter this proxy, so either development listener is a valid app entry.
  app.use(createProxyMiddleware({
    target: `http://127.0.0.1:${Number(process.env.TALLY_FRONTEND_PORT) || 5000}`,
    changeOrigin: false,
    ws: true,
  }))
}
app.use((error, req, res, _next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: error.issues.map((issue) => `${issue.path.join('.') || 'Input'}: ${issue.message}`).slice(0, 4).join(' '),
    })
  }
  const status = error.status >= 400 && error.status < 500 ? error.status : 500
  if (status >= 500) req.log.error({ code: error.code, type: error.name }, 'Request failed')
  res.status(status).json({ error: status < 500 ? error.message : 'Tally could not complete that request. Your existing saved data is unchanged. Please try again.' })
})
