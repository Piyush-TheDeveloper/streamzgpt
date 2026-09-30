import { describe, expect, it } from 'vitest'
import { homeFeeds, sortOptions } from './feeds'
import type { Profile } from '@/types/profile'

const NOW = new Date('2026-09-30T12:00:00Z')
const base: Profile = {
  id: '1',
  userId: 'u',
  name: 'Sam',
  avatar: 'lime',
  kids: false,
  autoplayTrailers: true,
  genres: [],
  region: 'IN',
}
const titles = (p: Profile) => homeFeeds(p, NOW).rows.map(r => r.title)

describe('homeFeeds', () => {
  it('shows Indian trending, per-language and regional rows for India', () => {
    expect(titles(base)).toEqual([
      'Trending in India',
      'Popular in India',
      'Hindi movies',
      'Tamil movies',
      'Telugu movies',
      'Malayalam movies',
      'Kannada movies',
      'All-time greats from India',
      'Coming soon in India',
    ])
  })

  it('uses the region for the spotlight, rows and language filters', () => {
    const f = homeFeeds(base, NOW)
    expect(f.spotlight.key).toEqual(['movies', 'now_playing', 'IN'])
    const tamil = f.rows.find(r => r.title === 'Tamil movies')!
    expect(tamil.feed.key[1]).toMatchObject({ country: 'IN', language: 'ta' })
  })

  it('has no language rows for single-language regions and no region rows worldwide', () => {
    expect(titles({ ...base, region: 'GB' })).not.toContain('English movies')
    // Cross-border languages must not become rows like "Spanish movies from the US".
    expect(titles({ ...base, region: 'US' }).join()).not.toMatch(
      /Spanish|English movies/,
    )
    const world = titles({ ...base, region: 'ALL' })
    expect(world).toEqual([
      'Popular right now',
      'All-time greats',
      'Coming soon',
    ])
  })

  it('adds a personalised row first when genres are chosen', () => {
    const f = homeFeeds({ ...base, genres: [878, 53] }, NOW)
    expect(f.rows[0].title).toBe('Picked for Sam')
    expect(f.rows[0].feed.key[1]).toMatchObject({
      genres: '878|53',
      kids: false,
      country: 'IN',
    })
  })

  it('uses only kid-safe discover feeds for kids profiles', () => {
    const f = homeFeeds({ ...base, kids: true }, NOW)
    expect(f.spotlight.key[0]).toBe('discover')
    expect(f.rows.every(r => r.feed.key[0] === 'discover')).toBe(true)
    const keys = [f.spotlight, ...f.rows.map(r => r.feed)].map(x =>
      JSON.stringify(x.key),
    )
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('sortOptions', () => {
  it('trending = popular among recent releases, with a low vote floor', () => {
    const o = sortOptions('trending', NOW)
    expect(o.sort).toBe('popularity.desc')
    expect(o.minVotes).toBe(5)
    expect(o.releasedBefore).toBe('2026-09-30')
    expect(o.releasedAfter).toBe('2025-03-29')
  })
  it('never lists unreleased films, whatever the sort', () => {
    for (const mode of ['trending', 'popular', 'top', 'newest'] as const) {
      expect(sortOptions(mode, NOW).releasedBefore, mode).toBe('2026-09-30')
    }
  })
})
