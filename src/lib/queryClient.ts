import { QueryClient } from '@tanstack/react-query'
import { TmdbError } from '@/services/tmdb'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      retry: (n, e) => !(e instanceof TmdbError) && n < 1,
      refetchOnWindowFocus: false,
    },
  },
})
