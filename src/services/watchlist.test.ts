import { AppwriteException } from 'appwrite'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const tables = vi.hoisted(() => ({
  createRow: vi.fn(),
  deleteRow: vi.fn(),
  listRows: vi.fn(),
}))

vi.mock('@/lib/appwrite', () => ({
  tables,
  DATABASE_ID: 'db',
  WATCHLIST_TABLE: 'w',
}))

const {
  addToWatchlist,
  clearWatchlist,
  listWatchlist,
  removeFromWatchlist,
  toMovie,
  watchlistRowId,
} = await import('./watchlist')

const movie = {
  id: 7,
  title: 'Seven',
  overview: '',
  poster_path: '/p.jpg',
  backdrop_path: null,
  release_date: '2020-01-01',
  vote_average: 7.5,
}
const fail = (code: number) => new AppwriteException('x', code)

beforeEach(() => vi.resetAllMocks())

describe('row helpers', () => {
  it('builds a deterministic row id that fits Appwrite limits', () => {
    const id = watchlistRowId('68e0f1a2b3c4d5e6f7a8', 1234567)
    expect(id).toBe('68e0f1a2b3c4d5e6f7a8_1234567')
    expect(id.length).toBeLessThanOrEqual(36)
  })
  it('rebuilds a card from a stored snapshot, tolerating nulls', () => {
    expect(
      toMovie({ movieId: 9, title: 'X', posterPath: null } as never),
    ).toMatchObject({ id: 9, title: 'X', poster_path: null, vote_average: 0 })
  })
})

describe('addToWatchlist', () => {
  it('creates an owner-scoped row with the deterministic id', async () => {
    tables.createRow.mockResolvedValue({})
    await addToWatchlist('u1', 'p1', movie)
    const arg = tables.createRow.mock.calls[0][0]
    expect(arg.rowId).toBe('p1_7')
    expect(arg.data).toMatchObject({
      profileId: 'p1',
      userId: 'u1',
      movieId: 7,
    })
    expect(arg.permissions).toHaveLength(3)
  })
  it('treats 409 (already saved) as success', async () => {
    tables.createRow.mockRejectedValue(fail(409))
    await expect(addToWatchlist('u1', 'p1', movie)).resolves.toBeUndefined()
  })
  it('rethrows other errors', async () => {
    tables.createRow.mockRejectedValue(fail(500))
    await expect(addToWatchlist('u1', 'p1', movie)).rejects.toThrow()
  })
})

describe('removeFromWatchlist', () => {
  it('treats 404 (already gone) as success but rethrows others', async () => {
    tables.deleteRow.mockRejectedValueOnce(fail(404))
    await expect(removeFromWatchlist('p1', 7)).resolves.toBeUndefined()
    tables.deleteRow.mockRejectedValueOnce(fail(401))
    await expect(removeFromWatchlist('p1', 7)).rejects.toThrow()
  })
})

describe('paging', () => {
  const page = (n: number, from: number) =>
    Array.from({ length: n }, (_, i) => ({
      $id: `p1_${from + i}`,
      movieId: from + i,
      title: `M${from + i}`,
    }))
  it('reads every page, not just the first 100', async () => {
    tables.listRows
      .mockResolvedValueOnce({ rows: page(100, 0) })
      .mockResolvedValueOnce({ rows: page(30, 100) })
    const list = await listWatchlist('p1')
    expect(list).toHaveLength(130)
    expect(tables.listRows).toHaveBeenCalledTimes(2)
  })
  it('clears all rows for a profile', async () => {
    tables.listRows.mockResolvedValue({ rows: page(3, 1) })
    tables.deleteRow.mockResolvedValue({})
    await clearWatchlist('p1')
    expect(tables.deleteRow).toHaveBeenCalledTimes(3)
  })
})
