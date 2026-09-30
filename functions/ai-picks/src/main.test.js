import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const json = (body, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => body,
})

const tmdbFor = (certs = {}) =>
  vi.fn(async (url, init) => {
    url = String(url)
    if (url.includes('/tablesdb/')) {
      const id = decodeURIComponent(url.split('/rows/')[1])
      return id === 'mine'
        ? json({ userId: 'u1', kids: false })
        : id === 'kid'
          ? json({ userId: 'u1', kids: true })
          : json({ userId: 'someone-else', kids: false })
    }
    if (url.includes('groq.com')) {
      const prompt = JSON.parse(init.body).messages[1].content
      return json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                picks: [
                  {
                    title: 'Heat',
                    year: 1995,
                    reason: `for: ${prompt.slice(0, 20)}`,
                  },
                  { title: 'Up', year: 2009, reason: 'family' },
                ],
              }),
            },
          },
        ],
      })
    }
    if (url.includes('/search/movie')) {
      const title = new URL(url).searchParams.get('query')
      const id = title === 'Heat' ? 1 : 2
      return json({ results: [{ id, title, poster_path: '/p.jpg' }] })
    }
    if (url.includes('/release_dates')) {
      const id = url.match(/movie\/(\d+)\//)[1]
      return json({
        results: [
          {
            iso_3166_1: 'US',
            release_dates: [{ type: 3, certification: certs[id] ?? 'R' }],
          },
        ],
      })
    }
    throw new Error(`unexpected fetch ${url}`)
  })

const run = async (overrides = {}) => {
  const { default: handler } = await import('./main.js')
  const out = { status: null, body: null }
  const res = {
    json: (body, status = 200) => {
      out.status = status
      out.body = body
      return out
    },
  }
  await handler({
    req: {
      method: 'POST',
      headers: { 'x-appwrite-user-id': 'u1', 'x-appwrite-key': 'dyn' },
      bodyJson: { profileId: 'mine', prompt: 'funny heist' },
      ...overrides,
    },
    res,
    log: () => {},
    error: () => {},
  })
  return out
}

beforeEach(() => {
  vi.stubEnv('GROQ_API_KEY', 'g')
  vi.stubEnv('TMDB_TOKEN', 't')
  vi.stubEnv('APPWRITE_FUNCTION_API_ENDPOINT', 'https://x/v1')
  vi.stubEnv('APPWRITE_FUNCTION_PROJECT_ID', 'proj')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('ai-picks handler', () => {
  it('rejects non-POST, anonymous and unconfigured calls', async () => {
    vi.stubGlobal('fetch', tmdbFor())
    expect((await run({ method: 'GET' })).status).toBe(405)
    expect((await run({ headers: {} })).status).toBe(401)
    vi.stubEnv('GROQ_API_KEY', '')
    expect((await run()).status).toBe(503)
  })

  it('rejects bad input and other users’ profiles', async () => {
    vi.stubGlobal('fetch', tmdbFor())
    expect((await run({ bodyJson: { prompt: 'x' } })).status).toBe(400)
    expect((await run({ bodyJson: { profileId: 'theirs' } })).status).toBe(403)
  })

  it('returns enriched picks end to end', async () => {
    vi.stubGlobal('fetch', tmdbFor())
    const out = await run()
    expect(out.status).toBe(200)
    expect(out.body.partial).toBe(false)
    expect(out.body.picks.map(p => p.movie.title)).toEqual(['Heat', 'Up'])
    expect(out.body.picks[0].reason).toContain('funny heist')
  })

  it('keeps only family-certified titles for a kids profile (from the profile row)', async () => {
    vi.stubGlobal('fetch', tmdbFor({ 2: 'PG' }))
    const out = await run({
      bodyJson: { profileId: 'kid', prompt: 'x', kids: false /* ignored */ },
    })
    expect(out.body.picks.map(p => p.movie.title)).toEqual(['Up'])
  })

  it('flags a partial result when some TMDB lookups fail', async () => {
    const base = tmdbFor()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (u, i) =>
        String(u).includes('query=Up')
          ? Promise.reject(new Error('boom'))
          : base(u, i),
      ),
    )
    const out = await run()
    expect(out.status).toBe(200)
    expect(out.body.partial).toBe(true)
    expect(out.body.picks.map(p => p.movie.title)).toEqual(['Heat'])
  })

  it('maps Groq rate limits and failures to friendly codes', async () => {
    const base = tmdbFor()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (u, i) =>
        String(u).includes('groq') ? { ok: false, status: 429 } : base(u, i),
      ),
    )
    expect((await run()).body.error).toBe('rate_limited')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (u, i) =>
        String(u).includes('groq') ? { ok: false, status: 500 } : base(u, i),
      ),
    )
    expect((await run()).body.error).toBe('upstream_error')
  })
})
