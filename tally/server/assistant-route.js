import { Router } from 'express'
import { getAuth } from '@clerk/express'
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import { assistantSchema } from './validation.js'
import { assistantReply } from './assistant.js'
import { requireSameOrigin } from './request-origin.js'

// Conversation produces a proposal, never a cloud kitchen read or write.
// Keep this public router separate from the account-only storage router.
export function createAssistantRouter({
  reply = assistantReply,
  identify = (req) => getAuth(req).userId,
  limit = 20,
} = {}) {
  const router = Router()
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('Vary', 'Cookie')
    next()
  })
  router.post('/', requireSameOrigin, rateLimit({
    windowMs: 300000,
    limit,
    keyGenerator: (req) => {
      const userId = identify(req)
      return userId ? `account:${userId}` : `guest:${ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown')}`
    },
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Give your kitchen assistant a moment. Please try again shortly.' },
  }), async (req, res) => {
    const input = assistantSchema.parse(req.body)
    res.json(await reply(input))
  })
  return router
}
