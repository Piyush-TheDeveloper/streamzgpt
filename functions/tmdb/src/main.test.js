import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ok = body => ({ status: 200, json: async () => body })

const call = async (path, { user = 'u1', method = 'POST', body } = {}) => {
  const { default: handler } = await import('./main.js')
  const out = { status: null, body: null }
  await handler({
    req: {
      method,
      headers: user ? { 'x-appwrite-user-id': user } : {},
      bodyJson: body ?? { path },
    },
    res: {
      json: (b, s = 200) => {
        out.status = s
        out.body = b
      },
    },
    error: () => {},
  })
  return out
}

beforeEach(() => vi.stubEnv('TMDB_TOKEN', 't'))
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules() // fresh cache and rate limiter per test
})

describe('tmdb handler', () => {
  it('rejects non-POST, anonymous, unconfigured and disallowed requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ok({})),
    )
    expect((await call('/movie/popular', { method: 'GET' })).status).toBe(405)
    expect((await call('/movie/popular', { user: null })).status).toBe(401)
    expect((await call('/account')).status).toBe(400)
    vi.stubEnv('TMDB_TOKEN', '')
    expect((await call('/movie/popular')).status).toBe(503)
  })

  it('proxies allowed paths and serves repeats from the cache', async () => {
    const f = vi.fn(async () => ok({ page: 1, results: [] }))
    vi.stubGlobal('fetch', f)
    const first = await call('/movie/popular?page=1')
    const second = await call('/movie/popular?page=1')
    expect(first).toEqual({ status: 200, body: { page: 1, results: [] } })
    expect(second.status).toBe(200)
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('remembers 404s and maps upstream failures', async () => {
    const f = vi.fn(async () => ({ status: 404, json: async () => ({}) }))
    vi.stubGlobal('fetch', f)
    expect((await call('/movie/1')).status).toBe(404)
    expect((await call('/movie/1')).status).toBe(404)
    expect(f).toHaveBeenCalledTimes(1)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 429, json: async () => ({}) })),
    )
    expect((await call('/movie/2')).body.error).toBe('rate_limited')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 500, json: async () => ({}) })),
    )
    expect((await call('/movie/3')).status).toBe(502)
  })

  it('rate-limits a single account', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ok({ results: [] })),
    )
    let limited = 0
    for (let i = 1; i <= 130; i++) {
      if ((await call(`/movie/popular?page=${i}`)).status === 429) limited++
    }
    expect(limited).toBe(10)
    // Another account is unaffected.
    expect((await call('/movie/popular?page=200', { user: 'u2' })).status).toBe(
      200,
    )
  })
})
