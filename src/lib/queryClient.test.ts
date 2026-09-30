import { describe, expect, it } from 'vitest'
import { TmdbError } from '@/services/tmdb'
import { shouldRetry } from './queryClient'

describe('shouldRetry', () => {
  it('retries transient failures once', () => {
    expect(shouldRetry(0, new TmdbError('x', 502))).toBe(true)
    expect(shouldRetry(0, new TmdbError('x'))).toBe(true)
    expect(shouldRetry(0, new Error('network'))).toBe(true)
    expect(shouldRetry(1, new TmdbError('x', 502))).toBe(false)
  })
  it('does not retry client errors or aborts', () => {
    expect(shouldRetry(0, new TmdbError('x', 404))).toBe(false)
    expect(shouldRetry(0, new TmdbError('x', 429))).toBe(false)
    expect(shouldRetry(0, new TmdbError('x', 401))).toBe(false)
    expect(shouldRetry(0, new DOMException('aborted', 'AbortError'))).toBe(
      false,
    )
  })
})
