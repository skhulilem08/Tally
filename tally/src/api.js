const base = import.meta.env.BASE_URL.replace(/\/$/, '')

export async function api(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(data?.error || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }
  return data
}
