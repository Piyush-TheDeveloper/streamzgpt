import {
  createCache,
  createRateLimiter,
  fetchTmdb,
  normalizePath,
} from './logic.js'

const cache = createCache()
const allow = createRateLimiter()
// Identical concurrent requests share one TMDB call.
const inflight = new Map()

/**
 * POST { path: "/movie/popular?page=1" } -> same status + TMDB JSON body.
 * The TMDB token (function variable TMDB_TOKEN) never reaches the browser.
 * Execute permission is limited to signed-in users; only allow-listed read-only
 * endpoints are reachable, and successful responses are cached for 10 minutes.
 */
export default async ({ req, res, error }) => {
  if (req.method !== 'POST')
    return res.json({ error: 'method_not_allowed' }, 405)
  const userId = req.headers['x-appwrite-user-id']
  if (!userId) return res.json({ error: 'unauthorized' }, 401)
  // One account can't drain the shared TMDB quota.
  if (!allow(userId)) return res.json({ error: 'rate_limited' }, 429)
  const token = process.env.TMDB_TOKEN
  if (!token) return res.json({ error: 'not_configured' }, 503)

  let body
  try {
    body = req.bodyJson ?? JSON.parse(req.bodyText || '{}')
  } catch {
    return res.json({ error: 'bad_request' }, 400)
  }
  const path = normalizePath(body?.path)
  if (!path) return res.json({ error: 'bad_request' }, 400)

  const cached = cache.get(path)
  if (cached) return res.json(cached.data, cached.status)

  try {
    let pending = inflight.get(path)
    if (!pending) {
      pending = fetchTmdb(path, token).finally(() => inflight.delete(path))
      inflight.set(path, pending)
    }
    const { status, data } = await pending
    if (status === 200 && data) {
      cache.set(path, { status: 200, data })
      return res.json(data, 200)
    }
    if (status === 404) {
      // Remember "not found" briefly so a removed film isn't re-fetched every time.
      const body = { error: 'not_found' }
      cache.set(path, { status: 404, data: body }, 60_000)
      return res.json(body, 404)
    }
    if (status === 401) error('TMDB rejected the token (401)')
    if (status === 429) return res.json({ error: 'rate_limited' }, 429)
    return res.json({ error: 'upstream_error', status }, 502)
  } catch (e) {
    error(`TMDB request failed: ${e.message}`)
    return res.json({ error: 'upstream_error' }, 502)
  }
}
