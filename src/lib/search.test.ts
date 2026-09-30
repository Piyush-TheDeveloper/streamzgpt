import { describe, expect, it } from 'vitest'
import { filterResults, matchesTitle, uniqueById } from './search'
import type { Movie } from '@/types/movie'

const m = (
  id: number,
  genre_ids?: number[],
  title = `M${id}`,
  original_language?: string,
): Movie => ({
  id,
  title,
  overview: '',
  poster_path: null,
  backdrop_path: null,
  release_date: '',
  vote_average: 0,
  genre_ids,
  original_language,
})

describe('filterResults', () => {
  const movies = [m(1, [28]), m(2, [16, 35]), m(3, [10751]), m(4)]
  it('passes everything through with no genre', () => {
    expect(filterResults(movies, { genre: null })).toHaveLength(4)
  })
  it('filters by genre, dropping titles without genres', () => {
    expect(filterResults(movies, { genre: 16 }).map(x => x.id)).toEqual([2])
  })
})

describe('filterResults by language', () => {
  const movies = [
    m(1, [18], 'A', 'ta'),
    m(2, [18], 'B', 'hi'),
    m(3, [35], 'C', 'ta'),
  ]
  it('keeps only films in the chosen original language', () => {
    expect(
      filterResults(movies, { genre: null, language: 'ta' }).map(x => x.id),
    ).toEqual([1, 3])
  })
  it('combines language and genre', () => {
    expect(
      filterResults(movies, { genre: 35, language: 'ta' }).map(x => x.id),
    ).toEqual([3])
  })
})

describe('matchesTitle', () => {
  const movies = [m(1, [], 'Finding Nemo'), m(2, [], 'Moana'), m(3, [], 'Cars')]
  it('matches case-insensitively', () => {
    expect(matchesTitle(movies, ' NEMO ').map(x => x.id)).toEqual([1])
  })
  it('returns everything for an empty query', () => {
    expect(matchesTitle(movies, '  ')).toHaveLength(3)
  })
})

describe('uniqueById', () => {
  it('removes duplicates keeping the first', () => {
    expect(uniqueById([m(1), m(2), m(1)]).map(x => x.id)).toEqual([1, 2])
  })
})
