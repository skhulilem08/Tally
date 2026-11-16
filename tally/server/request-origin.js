import { getClerkProxyHost } from './clerk-proxy.js'

export function requireSameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const allowed = new Set([
    getClerkProxyHost(req), req.headers.host,
    ...(process.env.REPLIT_DOMAINS || '').split(','),
  ])
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('localhost:5000')
    allowed.add('127.0.0.1:5000')
  }
  if (req.headers['sec-fetch-site'] === 'cross-site') {
    return res.status(403).json({ error: 'Open Tally directly to make this change.' })
  }
  if (req.headers.origin) {
    try {
      if (!allowed.has(new URL(req.headers.origin).host)) {
        return res.status(403).json({ error: 'Request origin is not allowed.' })
      }
    } catch {
      return res.status(403).json({ error: 'Invalid request origin.' })
    }
  }
  next()
}
