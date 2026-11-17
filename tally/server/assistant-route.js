import { Router, raw } from 'express'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { z } from 'zod'
import { getAuth } from '@clerk/express'
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import { assistantSchema } from './validation.js'
import { assistantReply } from './assistant.js'
import { requireSameOrigin } from './request-origin.js'
import { loadAssistantState, saveAssistantState } from './assistant-state-store.js'
import { assistantStateSchema, memoryMarkdown } from '../shared/assistant-state.js'
import { transcribeSpeech, speakText } from './assistant-speech.js'

// Conversation produces a proposal, never a cloud kitchen read or write.
// Keep this public router separate from the account-only storage router.
export function createAssistantRouter({
  reply = assistantReply,
  identify = (req) => getAuth(req).userId,
  limit = 20,
  load = loadAssistantState,
  save = saveAssistantState,
  transcribe = transcribeSpeech,
  speak = speakText,
} = {}) {
  const router = Router()
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('Vary', 'Cookie')
    next()
  })
  // A spoken turn uses each provider stage once. Independent budgets prevent
  // the seventh normal turn from hitting a shared 20-request cap mid-call.
  const providerLimit = (identifier) => rateLimit({
    windowMs: 300000,
    limit,
    identifier,
    keyGenerator: (req) => {
      const userId = identify(req)
      return userId ? `account:${userId}` : `guest:${ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown')}`
    },
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Give your kitchen assistant a moment. Please try again shortly.' },
  })
  const replyLimit = providerLimit('assistant-replies')
  const transcriptionLimit = providerLimit('speech-recognition')
  const speechLimit = providerLimit('speech-playback')
  const requireOwner = (req, res, next) => {
    req.assistantOwner = identify(req)
    if (!req.assistantOwner) return res.status(401).json({ error: 'Sign in to access account memory. Guest memory stays on this device.' })
    next()
  }
  const stateLimit = rateLimit({
    windowMs: 60000, limit: 1200,
    keyGenerator: (req) => req.assistantOwner,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Conversation changes are arriving too quickly. Wait a moment and reload.' },
  })
  router.use(['/state', '/memory.md'], requireOwner, stateLimit)
  router.get('/state', requireOwner, async (req, res) => res.json(await load(req.assistantOwner)))
  router.put('/state', requireSameOrigin, requireOwner, async (req, res) => {
    const input = z.object({ expectedRevision: z.number().int().min(0), expectedOwner: z.string().optional(), state: assistantStateSchema }).parse(req.body)
    if (input.expectedOwner && input.expectedOwner !== req.assistantOwner) {
      return res.status(409).json({ error: 'Your account changed. No conversation data was transferred.' })
    }
    res.json(await save(req.assistantOwner, input.expectedRevision, input.state))
  })
  router.get('/memory.md', requireOwner, async (req, res) => {
    const { state } = await load(req.assistantOwner)
    res.type('text/markdown').setHeader('Content-Disposition', 'attachment; filename="memory.md"')
    res.send(memoryMarkdown(state.memory))
  })
  // Rate limit before reading/decoding audio; bound memory and paid usage.
  router.post('/transcribe', requireSameOrigin, transcriptionLimit, raw({ type: 'audio/wav', limit: '626kb' }), async (req, res) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 45000)
    res.on('close', () => { if (!res.writableEnded) controller.abort() })
    try { res.json(await transcribe(req.body, controller.signal)) }
    catch (error) {
      if (!res.headersSent) res.status(error.status || 502).json({
        error: error.status === 400 || /^(The speech|No transcript)/.test(error.message)
          ? error.message : 'Speech recognition failed. Try again or use manual entry.',
      })
    }
    finally { clearTimeout(timer) }
  })
  router.post('/speak', requireSameOrigin, speechLimit, async (req, res) => {
    const { text } = z.object({ text: z.string().trim().min(1).max(2200) }).parse(req.body)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 45000)
    res.on('close', () => { if (!res.writableEnded) controller.abort() })
    try {
      const response = await speak(text, controller.signal)
      res.type('audio/mpeg')
      await pipeline(Readable.fromWeb(response.body), res)
    } catch (error) {
      if (!res.headersSent) res.status(502).json({
        error: /^(The speech|No built-in)/.test(error.message) ? error.message : 'Speech playback failed. The reply remains visible in your conversation.',
      })
      else res.destroy()
    } finally { clearTimeout(timer) }
  })
  router.post('/', requireSameOrigin, replyLimit, async (req, res) => {
    const input = assistantSchema.parse(req.body)
    const owner = identify(req)
    if (owner && input.contextRevision !== undefined) {
      const current = await load(owner)
      if (current.revision !== input.contextRevision) return res.status(409).json({ error: 'Your conversation changed. Reload it before continuing.' })
      input.memory = current.state.memory
      input.memoryEnabled = current.state.enabled
      input.summary = current.state.summary
    } else if (owner) {
      // Legacy text clients cannot inject account-memory context.
      input.memory = null
      input.memoryEnabled = false
      input.summary = ''
    }
    res.json(await reply(input))
  })
  return router
}
