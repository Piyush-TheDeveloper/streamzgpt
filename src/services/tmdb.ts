import { env } from '@/lib/env'
import type {
  Movie,
  MovieCategory,
  MovieDetails,
  Paginated,
  Video,
} from '@/types/movie'

const BASE_URL = 'https://api.themoviedb.org/3'
const IMG_URL = 'https://image.tmdb.org/t/p'

export class TmdbError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!env.tmdbToken) {
    throw new TmdbError(
      import.meta.env.DEV
        ? 'Missing VITE_TMDB_TOKEN. See .env.example.'
        : 'Movies are unavailable right now.',
    )
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    signal,
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${env.tmdbToken}`,
    },
  })
  if (!res.ok)
    throw new TmdbError(`TMDB request failed (${res.status})`, res.status)
  return res.json() as Promise<T>
}

export const getMoviesByCategory = (
  category: MovieCategory,
  signal?: AbortSignal,
) => request<Paginated<Movie>>(`/movie/${category}?page=1`, signal)

export interface DiscoverOptions {
  /** TMDB genre ids; `|` = OR, `,` = AND. */
  genres?: string
  sort?: string
  minVotes?: number
  /** Family-friendly only: rated PG or below, defaulting to Animation|Family. */
  kids?: boolean
}

export function discoverPath({
  genres,
  sort = 'popularity.desc',
  minVotes = 300,
  kids = false,
}: DiscoverOptions) {
  const params = new URLSearchParams({
    sort_by: sort,
    'vote_count.gte': String(minVotes),
    include_adult: 'false',
    page: '1',
  })
  const g = genres || (kids ? '16|10751' : '')
  if (g) params.set('with_genres', g)
  if (kids) {
    params.set('certification_country', 'US')
    params.set('certification.lte', 'PG')
  }
  return `/discover/movie?${params}`
}

export const discoverMovies = (
  options: DiscoverOptions,
  signal?: AbortSignal,
) => request<Paginated<Movie>>(discoverPath(options), signal)

export const getMovieDetails = (id: number, signal?: AbortSignal) =>
  request<MovieDetails>(
    `/movie/${id}?append_to_response=videos,credits`,
    signal,
  )

export const getRecommendedMovies = (id: number, signal?: AbortSignal) =>
  request<Paginated<Movie>>(`/movie/${id}/recommendations?page=1`, signal)

/** Prefer an official YouTube trailer, then any trailer, then a teaser. */
export function pickTrailer(videos: Video[]): Video | null {
  const yt = videos.filter(v => v.site === 'YouTube')
  const rank = (v: Video) =>
    (v.type === 'Trailer' ? 2 : v.type === 'Teaser' ? 1 : 0) * 2 +
    (v.official ? 1 : 0)
  return (
    [...yt].sort((a, b) => rank(b) - rank(a)).find(v => rank(v) >= 2) ?? null
  )
}

export const imageUrl = (
  path: string | null,
  size: 'w92' | 'w342' | 'w500' | 'w780' | 'original' = 'w500',
) => (path ? `${IMG_URL}/${size}${path}` : null)
