// Pure helpers for the tmdb proxy function.

const TMDB = 'https://api.themoviedb.org/3'

// Only these read-only endpoints can be reached through the proxy.
const ROUTES = [
  /^\/movie\/(now_playing|popular|top_rated|upcoming)$/,
  /^\/trending\/movie\/week$/,
  /^\/discover\/movie$/,
  /^\/search\/movie$/,
  /^\/movie\/\d{1,9}$/,
  /^\/movie\/\d{1,9}\/recommendations$/,
]

// Query parameters the app actually uses. Anything else is dropped.
const PARAMS = new Set([
  'page',
  'query',
  'include_adult',
  'primary_release_year',
  'append_to_response',
  'with_genres',
  'sort_by',
  'vote_count.gte',
  'certification_country',
  'certification.gte',
  'certification.lte',
  'certification',
  'with_origin_country',
  'with_original_language',
  'primary_release_date.gte',
  'primary_release_date.lte',
  'region',
])

/**
 * Validates a client-supplied TMDB path (e.g. "/movie/popular?page=1") and
 * returns a normalised "path?query" string, or null if it isn't allowed.
 */
export function normalizePath(input) {
  if (
    typeof input !== 'string' ||
    input.length > 600 ||
    !input.startsWith('/')
  ) {
    return null
  }
  let url
  try {
    url = new URL(input, 'https://placeholder.invalid')
  } catch {
    return null
  }
  if (url.origin !== 'https://placeholder.invalid') return null
  if (!ROUTES.some(r => r.test(url.pathname))) return null

  const params = new URLSearchParams()
  const entries = [...url.searchParams].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  )
  for (const [key, value] of entries) {
    if (!PARAMS.has(key)) continue
    if (value.length > 100) return null
    if (key === 'page') {
      const page = Number(value)
      if (!Number.isInteger(page) || page < 1 || page > 500) return null
    }
    params.set(key, value)
  }
  // Adult content is never proxied, whatever the client asked for.
  params.set('include_adult', 'false')
  return `${url.pathname}?${params}`
}

/** Small LRU cache with TTL (function containers stay warm between calls). */
export function createCache({
  ttlMs = 10 * 60_000,
  max = 500,
  now = Date.now,
} = {}) {
  const store = new Map()
  return {
    get(key) {
      const hit = store.get(key)
      if (!hit) return undefined
      store.delete(key)
      if (hit.expires <= now()) return undefined
      store.set(key, hit) // re-insert: most recently used goes last
      return hit.value
    },
    set(key, value, ttl = ttlMs) {
      store.delete(key)
      if (store.size >= max) {
        for (const [k, v] of store) if (v.expires <= now()) store.delete(k)
      }
      if (store.size >= max) store.delete(store.keys().next().value)
      store.set(key, { value, expires: now() + ttl })
    },
    get size() {
      return store.size
    },
  }
}

/** Fixed-window per-key limiter, so one account can't drain the shared TMDB quota. */
export function createRateLimiter({
  limit = 120,
  windowMs = 60_000,
  now = Date.now,
} = {}) {
  const hits = new Map()
  return key => {
    const t = now()
    const entry = hits.get(key)
    if (!entry || entry.resetAt <= t) {
      hits.set(key, { count: 1, resetAt: t + windowMs })
      if (hits.size > 5000)
        for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k)
      return true
    }
    entry.count += 1
    return entry.count <= limit
  }
}

/** Fetches a normalised path from TMDB. Returns { status, data }. */
export async function fetchTmdb(path, token, fetchImpl = fetch) {
  const res = await fetchImpl(`${TMDB}${path}`, {
    headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}
