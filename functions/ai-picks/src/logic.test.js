import { describe, expect, it, vi } from 'vitest'
import {
  askGroq,
  buildMessages,
  enrichPicks,
  fetchProfileKids,
  GroqError,
  groqModels,
  parsePicks,
  resolvePick,
  validateInput,
} from './logic.js'

describe('validateInput', () => {
  it('clamps and cleans fields', () => {
    const v = validateInput({
      profileId: 'p1',
      prompt: '  ' + 'x'.repeat(500),
      genres: ['Drama', '', 5, ...Array(20).fill('A')],
      saved: ['Heat'],
      kids: false,
    })
    expect(v.prompt).toHaveLength(300)
    expect(v.genres.length).toBeLessThanOrEqual(8)
    expect(v.genres).not.toContain('')
    // kids must come from the profile row, never from the request body.
    expect(v).not.toHaveProperty('kids')
  })
  it('requires a profile id', () => {
    expect(() => validateInput({ prompt: 'x' })).toThrow(/profileId/)
  })
  it('rejects non-objects', () => {
    expect(() => validateInput(null)).toThrow()
    expect(() => validateInput('hi')).toThrow()
  })
})

describe('buildMessages', () => {
  it('includes context and the kids rule', () => {
    const msgs = buildMessages({
      profileId: 'p1',
      prompt: 'funny heist',
      mood: '',
      genres: ['Comedy'],
      saved: ['Ocean’s Eleven'],
      kids: true,
    })
    const user = msgs[1].content
    expect(user).toContain('funny heist')
    expect(user).toContain('Favourite genres: Comedy')
    expect(user).toContain('Already saved: Ocean’s Eleven')
    expect(msgs[0].content).toContain('rated G or PG')
  })
  it('falls back to a surprise request', () => {
    const msgs = buildMessages({
      prompt: '',
      mood: '',
      genres: [],
      saved: [],
      kids: false,
    })
    expect(msgs[1].content).toContain('surprise me')
  })
})

describe('parsePicks', () => {
  it('parses clean JSON, dedupes and sanitises', () => {
    const out = parsePicks(
      JSON.stringify({
        picks: [
          { title: 'Heat', year: 1995, reason: 'Cat and mouse.' },
          { title: 'heat', year: 1995, reason: 'dupe' },
          { title: '', reason: 'no title' },
          { title: 'Bad Year', year: 12 },
        ],
      }),
    )
    expect(out.map(p => p.title)).toEqual(['Heat', 'Bad Year'])
    expect(out[1].year).toBeNull()
  })
  it('recovers JSON wrapped in prose, and returns [] for garbage', () => {
    expect(
      parsePicks(
        'Sure! {"picks":[{"title":"Up","year":2009,"reason":"x"}]} enjoy',
      ).length,
    ).toBe(1)
    expect(parsePicks('nope')).toEqual([])
    expect(parsePicks('{"picks":"x"}')).toEqual([])
  })
  it('caps at 10 picks', () => {
    const picks = Array.from({ length: 20 }, (_, i) => ({
      title: `T${i}`,
      year: 2000,
      reason: '',
    }))
    expect(parsePicks(JSON.stringify({ picks }))).toHaveLength(10)
  })
})

const json = body => ({ ok: true, status: 200, json: async () => body })
const movie = (id, title, extra = {}) => ({
  id,
  title,
  poster_path: '/p.jpg',
  ...extra,
})

describe('resolvePick', () => {
  it('prefers an exact title match with a poster', async () => {
    const f = vi.fn().mockResolvedValue(
      json({
        results: [
          movie(1, 'Heat Wave'),
          movie(2, 'Heat'),
          movie(3, 'Heat', { poster_path: null }),
        ],
      }),
    )
    const m = await resolvePick({ title: 'Heat', year: 1995 }, 't', f)
    expect(m.id).toBe(2)
    expect(f.mock.calls[0][0]).toContain('primary_release_year=1995')
  })

  it('retries without the year when the model is off by one', async () => {
    const f = vi.fn(async url =>
      url.includes('primary_release_year')
        ? json({ results: [] })
        : json({
            results: [movie(5, 'Blade Runner', { release_date: '1982-06-25' })],
          }),
    )
    const m = await resolvePick({ title: 'Blade Runner', year: 1983 }, 't', f)
    expect(m.id).toBe(5)
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('ignores a trailing year in the title', async () => {
    const f = vi.fn().mockResolvedValue(json({ results: [movie(2, 'Heat')] }))
    expect(
      (await resolvePick({ title: 'Heat (1995)', year: null }, 't', f)).id,
    ).toBe(2)
  })

  it('does not resolve an invented title to an unrelated film', async () => {
    const f = vi
      .fn()
      .mockResolvedValue(json({ results: [movie(7, 'Toy Story')] }))
    expect(
      await resolvePick({ title: 'Night Garden', year: 2010 }, 't', f),
    ).toBeNull()
  })

  it('accepts a related title only when the year is close', async () => {
    const results = [movie(8, 'Dune: Part Two', { release_date: '2024-03-01' })]
    const f = vi.fn().mockResolvedValue(json({ results }))
    expect(
      await resolvePick({ title: 'Dune', year: 2024 }, 't', f),
    ).not.toBeNull()
    expect(await resolvePick({ title: 'Dune', year: 1984 }, 't', f)).toBeNull()
  })
})

describe('enrichPicks', () => {
  it('drops unresolved, already-saved and failing picks, and counts errors', async () => {
    const f = vi.fn(async url => {
      if (url.includes('Unknown')) return json({ results: [] })
      if (url.includes('Boom')) throw new Error('network')
      if (url.includes('Saved'))
        return json({ results: [movie(9, 'Saved One')] })
      return json({ results: [movie(1, 'Heat')] })
    })
    const { items, errors } = await enrichPicks({
      picks: [
        { title: 'Heat', year: null, reason: 'r1' },
        { title: 'Unknown', year: null, reason: '' },
        { title: 'Boom', year: null, reason: '' },
        { title: 'Saved', year: null, reason: '' },
      ],
      token: 't',
      kids: false,
      savedTitles: ['saved one'],
      fetchImpl: f,
    })
    expect(items).toHaveLength(1)
    expect(items[0].reason).toBe('r1')
    expect(errors).toBe(1)
  })

  it('keeps only family-certified titles for kids, preferring theatrical ratings', async () => {
    const f = vi.fn(async url => {
      if (url.includes('/search/movie')) {
        return json({
          results: [url.includes('Up') ? movie(10, 'Up') : movie(11, 'Saw')],
        })
      }
      const dates = url.includes('/10/')
        ? [
            { type: 4, certification: 'R' },
            { type: 3, certification: 'PG' },
          ]
        : [{ type: 3, certification: 'R' }]
      return json({ results: [{ iso_3166_1: 'US', release_dates: dates }] })
    })
    const { items } = await enrichPicks({
      picks: [
        { title: 'Up', year: null, reason: '' },
        { title: 'Saw', year: null, reason: '' },
      ],
      token: 't',
      kids: true,
      fetchImpl: f,
    })
    expect(items.map(o => o.movie.title)).toEqual(['Up'])
  })

  it('accepts Indian U-rated films for kids when there is no US rating', async () => {
    const f = vi.fn(async url => {
      if (url.includes('/search/movie'))
        return json({ results: [movie(20, 'Taare Zameen Par')] })
      return json({
        results: [
          {
            iso_3166_1: 'IN',
            release_dates: [{ type: 3, certification: 'U' }],
          },
        ],
      })
    })
    const { items } = await enrichPicks({
      picks: [{ title: 'Taare Zameen Par', year: null, reason: '' }],
      token: 't',
      kids: true,
      fetchImpl: f,
    })
    expect(items).toHaveLength(1)
  })

  it('removes duplicates that resolve to the same film', async () => {
    const f = vi.fn().mockResolvedValue(json({ results: [movie(1, 'Heat')] }))
    const { items } = await enrichPicks({
      picks: [
        { title: 'Heat', year: 1995, reason: 'a' },
        { title: 'Heat (1995)', year: null, reason: 'b' },
      ],
      token: 't',
      kids: false,
      fetchImpl: f,
    })
    expect(items).toHaveLength(1)
  })
})

describe('fetchProfileKids', () => {
  const base = {
    endpoint: 'https://x/v1',
    project: 'p',
    key: 'k',
    profileId: 'pr1',
    userId: 'u1',
  }
  it('returns the kids flag for the caller’s own profile', async () => {
    const f = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ userId: 'u1', kids: true }),
    })
    expect(await fetchProfileKids({ ...base, fetchImpl: f })).toEqual({
      kids: true,
    })
    expect(f.mock.calls[0][1].headers['x-appwrite-key']).toBe('k')
  })
  it('refuses another user’s profile and missing profiles', async () => {
    const other = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ userId: 'someone', kids: false }),
    })
    expect(await fetchProfileKids({ ...base, fetchImpl: other })).toBeNull()
    const missing = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    expect(await fetchProfileKids({ ...base, fetchImpl: missing })).toBeNull()
  })
  it('throws on other upstream failures (fail closed)', async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    await expect(fetchProfileKids({ ...base, fetchImpl: f })).rejects.toThrow()
  })
})

describe('askGroq', () => {
  const reply = content => ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  })
  const fail = status => ({ ok: false, status, text: async () => 'nope' })
  const base = { apiKey: 'k', messages: [{ role: 'user', content: 'x' }] }
  const bodyOf = f => f.mock.calls.map(c => JSON.parse(c[1].body))

  it('falls through a retired model (404) to the next one', async () => {
    const f = vi.fn(async (_u, init) =>
      JSON.parse(init.body).model === 'retired/model'
        ? fail(404)
        : reply('{"picks":[]}'),
    )
    const out = await askGroq({
      ...base,
      models: ['retired/model', 'openai/gpt-oss-120b'],
      fetchImpl: f,
    })
    expect(out).toEqual({
      content: '{"picks":[]}',
      model: 'openai/gpt-oss-120b',
    })
    expect(bodyOf(f).map(b => b.model)).toEqual([
      'retired/model',
      'openai/gpt-oss-120b',
    ])
  })

  it('retries once without JSON mode when a model rejects it (400)', async () => {
    const f = vi.fn(async (_u, init) =>
      JSON.parse(init.body).response_format
        ? {
            ok: false,
            status: 400,
            text: async () => 'response_format json_object is not supported',
          }
        : reply('ok'),
    )
    const out = await askGroq({
      ...base,
      models: ['qwen/qwen3.6-27b'],
      fetchImpl: f,
    })
    expect(out.content).toBe('ok')
    const [first, second] = bodyOf(f)
    expect(first.response_format).toEqual({ type: 'json_object' })
    expect(second.response_format).toBeUndefined()
  })

  it('only sends reasoning_effort to gpt-oss models', async () => {
    const f = vi.fn(async () => reply('ok'))
    await askGroq({ ...base, models: ['openai/gpt-oss-120b'], fetchImpl: f })
    await askGroq({ ...base, models: ['qwen/qwen3.6-27b'], fetchImpl: f })
    const [oss, qwen] = bodyOf(f)
    expect(oss.reasoning_effort).toBe('low')
    expect(qwen.reasoning_effort).toBeUndefined()
  })

  it('tries other models after a 429 (quotas are per model); limited only if all are', async () => {
    const f = vi.fn(async (_u, i) =>
      JSON.parse(i.body).model === 'a' ? fail(429) : reply('ok'),
    )
    expect(
      (await askGroq({ ...base, models: ['a', 'b'], fetchImpl: f })).model,
    ).toBe('b')
    const allLimited = vi.fn(async () => fail(429))
    await expect(
      askGroq({ ...base, models: ['a', 'b'], fetchImpl: allLimited }),
    ).rejects.toMatchObject({ code: 'rate_limited' })
    expect(allLimited).toHaveBeenCalledTimes(2)
  })

  it('stops immediately on a bad key', async () => {
    const bad = vi.fn(async () => fail(401))
    await expect(
      askGroq({ ...base, models: ['a', 'b'], fetchImpl: bad }),
    ).rejects.toMatchObject({ code: 'auth' })
    expect(bad).toHaveBeenCalledTimes(1)
  })

  it('fails with an upstream error when every model is unavailable', async () => {
    const f = vi.fn(async () => fail(404))
    await expect(
      askGroq({ ...base, models: ['a', 'b', 'c'], fetchImpl: f }),
    ).rejects.toBeInstanceOf(GroqError)
    expect(f).toHaveBeenCalledTimes(3)
  })

  it('logs status and a short body for diagnosis (never the key)', async () => {
    const log = vi.fn()
    await askGroq({
      ...base,
      models: ['a', 'openai/gpt-oss-120b'],
      fetchImpl: vi.fn(async (_u, i) =>
        JSON.parse(i.body).model === 'a' ? fail(404) : reply('x'),
      ),
      log,
    })
    expect(log.mock.calls[0][0]).toContain('a -> 404')
    expect(JSON.stringify(log.mock.calls)).not.toContain('Bearer')
  })

  it('tries GROQ_MODEL first, then the defaults without duplicates', () => {
    expect(groqModels('my/model')[0]).toBe('my/model')
    expect(groqModels(undefined)[0]).toBe('openai/gpt-oss-120b')
    expect(groqModels('openai/gpt-oss-120b')).toHaveLength(
      new Set(groqModels('openai/gpt-oss-120b')).size,
    )
  })

  it('does not retry an unrelated 400 (it would fail again)', async () => {
    const f = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => 'invalid reasoning_effort',
    }))
    await expect(
      askGroq({ ...base, models: ['a'], fetchImpl: f }),
    ).rejects.toBeInstanceOf(GroqError)
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('moves on when a model returns an empty completion', async () => {
    const f = vi.fn(async (_u, i) =>
      JSON.parse(i.body).model === 'a' ? reply('   ') : reply('{"picks":[]}'),
    )
    expect(
      (await askGroq({ ...base, models: ['a', 'b'], fetchImpl: f })).model,
    ).toBe('b')
  })

  it('moves on when reading the body fails', async () => {
    const f = vi.fn(async (_u, i) =>
      JSON.parse(i.body).model === 'a'
        ? {
            ok: true,
            status: 200,
            json: async () => {
              throw new SyntaxError('bad json')
            },
          }
        : reply('ok'),
    )
    expect(
      (await askGroq({ ...base, models: ['a', 'b'], fetchImpl: f })).model,
    ).toBe('b')
  })
})

describe('parsePicks with reasoning output', () => {
  it('ignores <think> blocks that contain braces', () => {
    const text =
      '<think>maybe {"picks": nope} hmm</think>{"picks":[{"title":"Up","year":2009,"reason":"x"}]}'
    expect(parsePicks(text).map(p => p.title)).toEqual(['Up'])
  })
})
