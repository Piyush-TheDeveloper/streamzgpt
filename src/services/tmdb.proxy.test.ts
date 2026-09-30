import { beforeEach, describe, expect, it, vi } from 'vitest'

const createExecution = vi.hoisted(() => vi.fn())
vi.mock('@/lib/appwrite', () => ({
  functions: { createExecution },
  TMDB_FUNCTION: 'tmdb',
}))
// No local token: requests must go through the Appwrite function.
vi.mock('@/lib/env', () => ({ env: { tmdbToken: undefined } }))

const { getMovieDetails, getMoviesByCategory, TmdbError } =
  await import('./tmdb')

const exec = (code: number, body: unknown, status = 'completed') => ({
  responseStatusCode: code,
  responseBody: JSON.stringify(body),
  status,
})

beforeEach(() => vi.resetAllMocks())

describe('tmdb via the Appwrite function', () => {
  it('posts the path and returns the parsed body', async () => {
    createExecution.mockResolvedValue(exec(200, { page: 1, results: [] }))
    await expect(getMoviesByCategory('popular')).resolves.toEqual({
      page: 1,
      results: [],
    })
    const arg = createExecution.mock.calls[0][0]
    expect(arg.functionId).toBe('tmdb')
    expect(JSON.parse(arg.body)).toEqual({ path: '/movie/popular?page=1' })
  })

  it('keeps the 404 status so pages can show "not found"', async () => {
    createExecution.mockResolvedValue(exec(404, { error: 'upstream_error' }))
    await expect(getMovieDetails(1)).rejects.toMatchObject({ status: 404 })
  })

  it('reports an unconfigured or failing function as TmdbError', async () => {
    createExecution.mockResolvedValue(exec(503, { error: 'not_configured' }))
    await expect(getMoviesByCategory('popular')).rejects.toBeInstanceOf(
      TmdbError,
    )
    createExecution.mockRejectedValue(new Error('offline'))
    await expect(getMoviesByCategory('popular')).rejects.toBeInstanceOf(
      TmdbError,
    )
  })
})
