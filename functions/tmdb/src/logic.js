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
  for (const [key, value] of [...url.searchParams].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (PARAMS.has(key) && value.length <= 200) params.set(key, value)
  }
  // Adult content is never proxied, whatever the client asked for.
  params.set('include_adult', 'false')
  return `${url.pathname}?${params}`
}

/** Small TTL cache with a size cap (function containers stay warm between calls). */
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
      if (hit.expires <= now()) {
        store.delete(key)
        return undefined
      }
      return hit.value
    },
    set(key, value) {
      if (store.size >= max) store.delete(store.keys().next().value)
      store.set(key, { value, expires: now() + ttlMs })
    },
    get size() {
      return store.size
    },
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
