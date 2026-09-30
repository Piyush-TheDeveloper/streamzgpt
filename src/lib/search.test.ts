import { describe, expect, it } from 'vitest'
import { filterResults, uniqueById } from './search'
import type { Movie } from '@/types/movie'

const m = (id: number, genre_ids?: number[]): Movie => ({
  id,
  title: `M${id}`,
  overview: '',
  poster_path: null,
  backdrop_path: null,
  release_date: '',
  vote_average: 0,
  genre_ids,
})

describe('filterResults', () => {
  const movies = [m(1, [28]), m(2, [16, 35]), m(3, [10751]), m(4)]
  it('passes everything through with no filters', () => {
    expect(filterResults(movies, { genre: null, kids: false })).toHaveLength(4)
  })
  it('filters by genre', () => {
    expect(
      filterResults(movies, { genre: 28, kids: false }).map(x => x.id),
    ).toEqual([1])
  })
  it('keeps only family titles for kids, dropping those without genres', () => {
    expect(
      filterResults(movies, { genre: null, kids: true }).map(x => x.id),
    ).toEqual([2, 3])
  })
})

describe('uniqueById', () => {
  it('removes duplicates keeping the first', () => {
    expect(uniqueById([m(1), m(2), m(1)]).map(x => x.id)).toEqual([1, 2])
  })
})
