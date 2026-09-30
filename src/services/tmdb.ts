import { env } from '@/lib/env'
import type { Movie, MovieCategory, Paginated } from '@/types/movie'

const BASE_URL = 'https://api.themoviedb.org/3'
const IMG_URL = 'https://image.tmdb.org/t/p'

export class TmdbError extends Error {}

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
  if (!res.ok) throw new TmdbError(`TMDB request failed (${res.status})`)
  return res.json() as Promise<T>
}

export const getMoviesByCategory = (
  category: MovieCategory,
  signal?: AbortSignal,
) => request<Paginated<Movie>>(`/movie/${category}?page=1`, signal)

export const imageUrl = (
  path: string | null,
  size: 'w342' | 'w500' | 'w780' | 'original' = 'w500',
) => (path ? `${IMG_URL}/${size}${path}` : null)
