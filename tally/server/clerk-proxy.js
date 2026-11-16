// JavaScript adaptation of Replit's canonical Clerk proxy middleware.
import { createProxyMiddleware } from 'http-proxy-middleware'
export const CLERK_PROXY_PATH = '/api/__clerk'
export function getClerkProxyHost(req) {
  const forwarded = req.headers['x-forwarded-host']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return raw?.split(',')[0]?.trim() || req.headers.host?.trim() || undefined
}
export function clerkProxyMiddleware() {
  if (process.env.NODE_ENV !== 'production' || !process.env.CLERK_SECRET_KEY) {
    return (_req, _res, next) => next()
  }
  return createProxyMiddleware({
    target: 'https://frontend-api.clerk.dev',
    changeOrigin: true,
    selfHandleResponse: true,
    pathRewrite: (path) => path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ''),
    on: {
      proxyReq: (proxyReq, req) => {
        const protocol = req.headers['x-forwarded-proto'] || 'https'
        proxyReq.setHeader('Clerk-Proxy-Url', `${protocol}://${getClerkProxyHost(req) || ''}${CLERK_PROXY_PATH}`)
        proxyReq.setHeader('Clerk-Secret-Key', process.env.CLERK_SECRET_KEY)
        const xff = req.headers['x-forwarded-for']
        const ip = (Array.isArray(xff) ? xff[0] : xff)?.split(',')[0]?.trim() || req.socket?.remoteAddress || ''
        if (ip) proxyReq.setHeader('X-Forwarded-For', ip)
      },
      proxyRes: (upstream, req, res) => {
        const headers = { ...upstream.headers }
        delete headers['transfer-encoding']
        delete headers.connection
        delete headers['keep-alive']
        const status = upstream.statusCode ?? 502
        if (status < 200 || status === 204) delete headers['content-length']
        const bodyless = req.method === 'HEAD' || status < 200 || status === 204 || status === 304
        if (headers['content-length'] !== undefined || bodyless) {
          res.writeHead(status, headers)
          upstream.on('error', () => res.destroy())
          upstream.pipe(res)
          return
        }
        const chunks = []
        upstream.on('data', (chunk) => chunks.push(chunk))
        upstream.on('end', () => {
          const body = Buffer.concat(chunks)
          res.writeHead(status, { ...headers, 'content-length': String(body.length) })
          res.end(body)
        })
        upstream.on('error', () => {
          if (!res.headersSent) res.writeHead(502, { 'content-length': '0' })
          res.end()
        })
      },
    },
  })
}
