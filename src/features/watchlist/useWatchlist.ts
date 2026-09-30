import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { useProfile } from '@/features/profiles/ProfileContext'
import {
  addToWatchlist,
  listWatchlist,
  removeFromWatchlist,
} from '@/services/watchlist'
import type { Movie } from '@/types/movie'

/** The active profile's "My List", with optimistic add/remove. */
export function useWatchlist() {
  const { user } = useAuth()
  const { active } = useProfile()
  const queryClient = useQueryClient()
  const profileId = active?.id
  const key = ['watchlist', profileId] as const

  const query = useQuery({
    queryKey: key,
    queryFn: () => listWatchlist(profileId!),
    enabled: Boolean(profileId),
    staleTime: 60_000,
  })

  const toggle = useMutation({
    mutationFn: async ({ movie, saved }: { movie: Movie; saved: boolean }) =>
      saved
        ? removeFromWatchlist(profileId!, movie.id)
        : addToWatchlist(user!.$id, profileId!, movie),
    onMutate: async ({ movie, saved }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Movie[]>(key)
      queryClient.setQueryData<Movie[]>(key, (list = []) =>
        saved ? list.filter(m => m.id !== movie.id) : [movie, ...list],
      )
      return { previous }
    },
    onError: (_e, _v, ctx) => queryClient.setQueryData(key, ctx?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  const movies = query.data ?? []
  return {
    movies,
    status: query.isError
      ? ('error' as const)
      : query.isPending
        ? ('loading' as const)
        : ('ready' as const),
    refetch: query.refetch,
    has: (id: number) => movies.some(m => m.id === id),
    toggle: (movie: Movie) =>
      toggle.mutate({ movie, saved: movies.some(m => m.id === movie.id) }),
    failed: toggle.isError,
  }
}
