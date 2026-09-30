import type { Movie } from '@/types/movie'

/**
 * Kids profiles can't filter search by certification (TMDB search has no such
 * filter), so only family-genre titles are listed; opening a title is still
 * gated on its real US certification.
 */
const FAMILY_GENRES = new Set([16, 10751])

export function filterResults(
  movies: Movie[],
  { genre, kids }: { genre: number | null; kids: boolean },
): Movie[] {
  return movies.filter(m => {
    const ids = m.genre_ids ?? []
    if (genre !== null && !ids.includes(genre)) return false
    if (kids && !ids.some(id => FAMILY_GENRES.has(id))) return false
    return true
  })
}

/** Merges pages, dropping titles TMDB repeats across page boundaries. */
export function uniqueById(movies: Movie[]): Movie[] {
  const seen = new Set<number>()
  return movies.filter(m => (seen.has(m.id) ? false : (seen.add(m.id), true)))
}
