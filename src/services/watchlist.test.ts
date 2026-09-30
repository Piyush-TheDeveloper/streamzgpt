import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/appwrite', () => ({
  tables: {},
  DATABASE_ID: 'db',
  WATCHLIST_TABLE: 'w',
}))

const { toMovie, watchlistRowId } = await import('./watchlist')

describe('watchlist', () => {
  it('builds a deterministic row id that fits Appwrite limits', () => {
    const id = watchlistRowId('68e0f1a2b3c4d5e6f7a8', 1234567)
    expect(id).toBe('68e0f1a2b3c4d5e6f7a8_1234567')
    expect(id.length).toBeLessThanOrEqual(36)
  })
  it('rebuilds a card from a stored snapshot, tolerating nulls', () => {
    expect(
      toMovie({ movieId: 9, title: 'X', posterPath: null } as never),
    ).toMatchObject({
      id: 9,
      title: 'X',
      poster_path: null,
      release_date: '',
      vote_average: 0,
    })
  })
})
