import { ExecutionMethod } from 'appwrite'
import { functions, TMDB_FUNCTION } from '@/lib/appwrite'
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

const UNAVAILABLE = import.meta.env.DEV
  ? 'TMDB is unavailable: set VITE_TMDB_TOKEN (local) or configure the `tmdb` function.'
  : 'Movies are unavailable right now.'

/** Direct call with a local token (development only; the token is public). */
async function direct<T>(path: string, signal?: AbortSignal): Promise<T> {
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

/** Production path: the `tmdb` Appwrite Function holds the token server-side. */
async function viaFunction<T>(path: string, signal?: AbortSignal): Promise<T> {
  signal?.throwIfAborted()
  let execution
  try {
    // The SDK can't cancel an execution, but we can stop waiting for it so a
    // superseded request (fast typing, genre switching) never blocks the UI.
    execution = await raceAbort(
      functions.createExecution({
        functionId: TMDB_FUNCTION,
        body: JSON.stringify({ path }),
        async: false,
        xpath: '/',
        method: ExecutionMethod.POST,
        headers: { 'content-type': 'application/json' },
      }),
      signal,
    )
  } catch (e) {
    if (signal?.aborted) throw e
    throw new TmdbError(UNAVAILABLE)
  }
  const code = execution.responseStatusCode
  if (execution.status !== 'completed' || code >= 400) {
    if (code === 404) throw new TmdbError('TMDB request failed (404)', 404)
    if (code === 401) throw new TmdbError('Please sign in again.', 401)
    if (code === 429)
      throw new TmdbError('Too many requests. Try again in a moment.', 429)
    if (code === 503) throw new TmdbError(UNAVAILABLE, 503)
    throw new TmdbError(UNAVAILABLE, code || 500)
  }
  try {
    return JSON.parse(execution.responseBody) as T
  } catch {
    throw new TmdbError(UNAVAILABLE)
  }
}

function raceAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason)
    signal.addEventListener('abort', onAbort, { once: true })
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', onAbort))
  })
}

// `env.tmdbToken` is only ever set in development (see lib/env), so production
// always goes through the function and never bundles a token.
function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  return env.tmdbToken ? direct<T>(path, signal) : viaFunction<T>(path, signal)
}

export const getMoviesByCategory = (
  category: MovieCategory,
  signal?: AbortSignal,
  region?: string,
) =>
  request<Paginated<Movie>>(
    `/movie/${category}?page=1${region ? `&region=${region}` : ''}`,
    signal,
  )

export interface DiscoverOptions {
  /** TMDB genre ids; `|` = OR, `,` = AND. */
  genres?: string
  sort?: string
  minVotes?: number
  page?: number
  /** ISO 3166-1 country the film originates from (e.g. "IN"). */
  country?: string
  /** ISO 639-1 original language (e.g. "ta"). */
  language?: string
  /** Release-date window, YYYY-MM-DD. */
  releasedAfter?: string
  releasedBefore?: string
  /** Family-friendly only: rated G/PG (or "U" for Indian certification). */
  kids?: boolean
}

export function discoverPath({
  genres,
  sort = 'popularity.desc',
  minVotes = 300,
  page = 1,
  country,
  language,
  releasedAfter,
  releasedBefore,
  kids = false,
}: DiscoverOptions) {
  const params = new URLSearchParams({
    sort_by: sort,
    'vote_count.gte': String(minVotes),
    include_adult: 'false',
    page: String(page),
  })
  const g = genres || (kids ? '16|10751' : '')
  if (g) params.set('with_genres', g)
  if (country) params.set('with_origin_country', country)
  if (language) params.set('with_original_language', language)
  if (releasedAfter) params.set('primary_release_date.gte', releasedAfter)
  if (releasedBefore) params.set('primary_release_date.lte', releasedBefore)
  if (kids) {
    if (country === 'IN') {
      // Indian films are rarely certified in the US; "U" is the all-ages rating.
      params.set('certification_country', 'IN')
      params.set('certification', 'U')
    } else {
      // US scale is NR < G < PG: bounding both ends excludes unrated titles.
      params.set('certification_country', 'US')
      params.set('certification.gte', 'G')
      params.set('certification.lte', 'PG')
    }
  }
  return `/discover/movie?${params}`
}

export const discoverMovies = (
  options: DiscoverOptions,
  signal?: AbortSignal,
) => request<Paginated<Movie>>(discoverPath(options), signal)

export const searchMovies = (
  query: string,
  page: number,
  signal?: AbortSignal,
) =>
  request<Paginated<Movie>>(
    `/search/movie?${new URLSearchParams({ query, page: String(page), include_adult: 'false' })}`,
    signal,
  )

export const getTrendingMovies = (page: number, signal?: AbortSignal) =>
  request<Paginated<Movie>>(`/trending/movie/week?page=${page}`, signal)

export const getMovieDetails = (id: number, signal?: AbortSignal) =>
  request<MovieDetails>(
    `/movie/${id}?append_to_response=videos,credits,release_dates`,
    signal,
  )

const KID_SAFE = new Set(['G', 'PG', 'TV-Y', 'TV-Y7', 'TV-G'])

/** The US theatrical/home certification, or '' when TMDB has none. */
export function usCertification(details: MovieDetails): string {
  const us = details.release_dates?.results.find(r => r.iso_3166_1 === 'US')
  return us?.release_dates.find(d => d.certification)?.certification ?? ''
}

export const isKidSafe = (certification: string) => KID_SAFE.has(certification)

/** Kid-safe by US rating (G/PG family) or Indian "U" (all ages). */
export function isKidSafeMovie(details: MovieDetails): boolean {
  if (isKidSafe(usCertification(details))) return true
  const india = details.release_dates?.results.find(r => r.iso_3166_1 === 'IN')
  return india?.release_dates.some(d => d.certification === 'U') ?? false
}

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
