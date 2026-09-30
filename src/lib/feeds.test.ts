import { describe, expect, it } from 'vitest'
import { homeFeeds } from './feeds'
import type { Profile } from '@/types/profile'

const base: Profile = {
  id: '1',
  userId: 'u',
  name: 'Sam',
  avatar: 'lime',
  kids: false,
  autoplayTrailers: true,
  genres: [],
}

describe('homeFeeds', () => {
  it('shows the standard rows for a regular profile', () => {
    const f = homeFeeds(base)
    expect(f.rows.map(r => r.title)).toEqual([
      'Popular right now',
      'All-time greats',
      'Coming soon',
    ])
  })
  it('adds a personalised row first when genres are chosen', () => {
    const f = homeFeeds({ ...base, genres: [878, 53] })
    expect(f.rows[0].title).toBe('Picked for Sam')
    expect(f.rows[0].feed.key).toEqual([
      'discover',
      { genres: '878|53', kids: false },
    ])
  })
  it('uses only kid-safe discover feeds for kids profiles', () => {
    const f = homeFeeds({ ...base, kids: true })
    expect(f.spotlight.key[0]).toBe('discover')
    expect(f.rows.every(r => r.feed.key[0] === 'discover')).toBe(true)
  })
})
