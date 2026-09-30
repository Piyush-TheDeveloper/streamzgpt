import type { Movie } from '@/types/movie'

export function filterResults(
  movies: Movie[],
  { genre }: { genre: number | null },
): Movie[] {
  if (genre === null) return movies
  return movies.filter(m => m.genre_ids?.includes(genre))
}

/** Case-insensitive title match, used to search inside a kid-safe catalogue. */
export const matchesTitle = (movies: Movie[], query: string): Movie[] => {
  const q = query.trim().toLowerCase()
  return q ? movies.filter(m => m.title.toLowerCase().includes(q)) : movies
}

/** Merges pages, dropping titles TMDB repeats across page boundaries. */
export function uniqueById(movies: Movie[]): Movie[] {
  const seen = new Set<number>()
  return movies.filter(m => (seen.has(m.id) ? false : (seen.add(m.id), true)))
}
