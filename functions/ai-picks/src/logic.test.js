import { describe, expect, it, vi } from 'vitest'
import {
  buildMessages,
  enrichPicks,
  parsePicks,
  resolvePick,
  validateInput,
} from './logic.js'

describe('validateInput', () => {
  it('clamps and cleans fields', () => {
    const v = validateInput({
      prompt: '  ' + 'x'.repeat(500),
      genres: ['Drama', '', 5, ...Array(20).fill('A')],
      saved: ['Heat'],
      kids: 'yes',
    })
    expect(v.prompt).toHaveLength(300)
    expect(v.genres.length).toBeLessThanOrEqual(8)
    expect(v.genres).not.toContain('')
    expect(v.kids).toBe(false)
  })
  it('rejects non-objects', () => {
    expect(() => validateInput(null)).toThrow()
    expect(() => validateInput('hi')).toThrow()
  })
})

describe('buildMessages', () => {
  it('includes context and the kids rule', () => {
    const msgs = buildMessages({
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

const json = body => ({ ok: true, json: async () => body })
const movie = (id, title, extra = {}) => ({
  id,
  title,
  poster_path: '/p.jpg',
  ...extra,
})

describe('resolvePick / enrichPicks', () => {
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

  it('drops unresolved, already-saved and failing picks', async () => {
    const f = vi.fn(async url => {
      if (url.includes('Unknown')) return json({ results: [] })
      if (url.includes('Boom')) throw new Error('network')
      if (url.includes('Saved'))
        return json({ results: [movie(9, 'Saved One')] })
      return json({ results: [movie(1, 'Heat')] })
    })
    const out = await enrichPicks({
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
    expect(out).toHaveLength(1)
    expect(out[0].reason).toBe('r1')
  })

  it('keeps only family-certified titles for kids', async () => {
    const f = vi.fn(async url => {
      if (url.includes('/search/movie')) {
        return json({
          results: [url.includes('Up') ? movie(10, 'Up') : movie(11, 'Saw')],
        })
      }
      const cert = url.includes('/10/') ? 'PG' : 'R'
      return json({
        results: [
          { iso_3166_1: 'US', release_dates: [{ certification: cert }] },
        ],
      })
    })
    const out = await enrichPicks({
      picks: [
        { title: 'Up', year: null, reason: '' },
        { title: 'Saw', year: null, reason: '' },
      ],
      token: 't',
      kids: true,
      fetchImpl: f,
    })
    expect(out.map(o => o.movie.title)).toEqual(['Up'])
  })

  it('removes duplicates that resolve to the same film', async () => {
    const f = vi.fn().mockResolvedValue(json({ results: [movie(1, 'Heat')] }))
    const out = await enrichPicks({
      picks: [
        { title: 'Heat', year: 1995, reason: 'a' },
        { title: 'Heat (1995)', year: null, reason: 'b' },
      ],
      token: 't',
      kids: false,
      fetchImpl: f,
    })
    expect(out).toHaveLength(1)
  })
})
