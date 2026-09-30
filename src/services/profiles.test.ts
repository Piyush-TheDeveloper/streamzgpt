import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/appwrite', () => ({
  tables: {},
  DATABASE_ID: 'db',
  PROFILES_TABLE: 't',
}))

const { toProfile } = await import('./profiles')

describe('toProfile', () => {
  it('fills defaults for optional columns', () => {
    const p = toProfile({
      $id: 'p1',
      userId: 'u1',
      name: 'Sam',
      avatar: 'sky',
    } as never)
    expect(p).toEqual({
      id: 'p1',
      userId: 'u1',
      name: 'Sam',
      avatar: 'sky',
      kids: false,
      autoplayTrailers: true,
      genres: [],
    })
  })
})
