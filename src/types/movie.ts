export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
}

export interface Paginated<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export type MovieCategory = 'now_playing' | 'popular' | 'top_rated' | 'upcoming'
