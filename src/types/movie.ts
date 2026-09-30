export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  genre_ids?: number[]
  original_language?: string
}

export interface Paginated<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export type MovieCategory = 'now_playing' | 'popular' | 'top_rated' | 'upcoming'

export interface Genre {
  id: number
  name: string
}

export interface Video {
  id: string
  key: string
  site: string
  type: string
  name: string
  official: boolean
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export interface MovieDetails extends Movie {
  tagline: string
  runtime: number | null
  genres: Genre[]
  videos: { results: Video[] }
  credits: { cast: CastMember[] }
  release_dates?: {
    results: {
      iso_3166_1: string
      release_dates: { certification: string }[]
    }[]
  }
}
