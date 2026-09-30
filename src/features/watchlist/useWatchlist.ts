import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { useProfile } from '@/features/profiles/ProfileContext'
import {
  addToWatchlist,
  listWatchlist,
  removeFromWatchlist,
} from '@/services/watchlist'
import type { Movie } from '@/types/movie'

const TOGGLE_KEY = ['watchlist-toggle']

function useWatchlistQuery<T = Movie[]>(select?: (list: Movie[]) => T) {
  const { active } = useProfile()
  const profileId = active?.id
  return useQuery({
    queryKey: ['watchlist', profileId],
    queryFn: () => listWatchlist(profileId!),
    enabled: Boolean(profileId),
    staleTime: 60_000,
    select,
  })
}

/** The active profile's saved films (for the My List page and Home row). */
export function useWatchlist() {
  const query = useWatchlistQuery()
  return {
    movies: query.data ?? [],
    status: query.isError
      ? ('error' as const)
      : query.isPending
        ? ('loading' as const)
        : ('ready' as const),
    refetch: query.refetch,
  }
}

/** Whether one film is saved. `select` keeps each card from re-rendering when
 *  unrelated entries change. */
export function useIsSaved(movieId: number) {
  return (
    useWatchlistQuery(list => list.some(m => m.id === movieId)).data ?? false
  )
}

/** Optimistic add/remove; failures roll back and surface via WatchlistNotice. */
export function useToggleWatchlist() {
  const { user } = useAuth()
  const { active } = useProfile()
  const queryClient = useQueryClient()
  const profileId = active?.id
  const key = ['watchlist', profileId] as const

  const mutation = useMutation({
    mutationKey: TOGGLE_KEY,
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

  return (movie: Movie, saved: boolean) => mutation.mutate({ movie, saved })
}

/** The most recent toggle error, for a single app-wide notice. */
export function useLastToggleError() {
  const states = useMutationState({
    filters: { mutationKey: TOGGLE_KEY },
    select: m => ({ status: m.state.status, at: m.state.submittedAt }),
  })
  const last = states.at(-1)
  return last?.status === 'error' ? last.at : null
}
