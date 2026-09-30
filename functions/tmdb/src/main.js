import { createCache, fetchTmdb, normalizePath } from './logic.js'

const cache = createCache()

/**
 * POST { path: "/movie/popular?page=1" } -> same status + TMDB JSON body.
 * The TMDB token (function variable TMDB_TOKEN) never reaches the browser.
 * Execute permission is limited to signed-in users; only allow-listed read-only
 * endpoints are reachable, and successful responses are cached for 10 minutes.
 */
export default async ({ req, res, error }) => {
  if (req.method !== 'POST')
    return res.json({ error: 'method_not_allowed' }, 405)
  if (!req.headers['x-appwrite-user-id'])
    return res.json({ error: 'unauthorized' }, 401)
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
  if (cached) return res.json(cached, 200)

  try {
    const { status, data } = await fetchTmdb(path, token)
    if (status === 200 && data) {
      cache.set(path, data)
      return res.json(data, 200)
    }
    // Pass TMDB's status through (e.g. 404 for an unknown film) without the body.
    if (status === 401) error('TMDB rejected the token (401)')
    return res.json(
      { error: 'upstream_error', status },
      status === 404 ? 404 : 502,
    )
  } catch (e) {
    error(`TMDB request failed: ${e.message}`)
    return res.json({ error: 'upstream_error' }, 502)
  }
}
