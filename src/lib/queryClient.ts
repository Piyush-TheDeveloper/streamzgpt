import { QueryClient } from '@tanstack/react-query'
import { TmdbError } from '@/services/tmdb'

/** Retry transient failures (network, 429, 5xx) once; never 4xx client errors. */
export const shouldRetry = (failureCount: number, error: unknown) => {
  if (failureCount >= 1) return false
  if (error instanceof DOMException && error.name === 'AbortError') return false
  if (error instanceof TmdbError) {
    const s = error.status
    return s === undefined || s === 429 || s >= 500
  }
  return true
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
  },
})
