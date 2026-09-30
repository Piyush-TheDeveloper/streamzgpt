import { describe, expect, it } from 'vitest'
import {
  discoverPath,
  imageUrl,
  isKidSafe,
  pickTrailer,
  usCertification,
} from './tmdb'
import type { MovieDetails, Video } from '@/types/movie'

describe('imageUrl', () => {
  it('builds a CDN url', () => {
    expect(imageUrl('/a.jpg', 'w342')).toBe(
      'https://image.tmdb.org/t/p/w342/a.jpg',
    )
  })
  it('returns null when there is no path', () => {
    expect(imageUrl(null)).toBeNull()
  })
})

const v = (over: Partial<Video>): Video => ({
  id: 'x',
  key: 'k',
  site: 'YouTube',
  type: 'Trailer',
  name: 'n',
  official: false,
  ...over,
})

describe('pickTrailer', () => {
  it('prefers official trailers over teasers and unofficial ones', () => {
    const picked = pickTrailer([
      v({ key: 'teaser', type: 'Teaser', official: true }),
      v({ key: 'unofficial' }),
      v({ key: 'official', official: true }),
    ])
    expect(picked?.key).toBe('official')
  })
  it('ignores non-YouTube and non-trailer videos', () => {
    expect(
      pickTrailer([v({ site: 'Vimeo' }), v({ type: 'Featurette' })]),
    ).toBeNull()
  })
})

describe('discoverPath', () => {
  it('builds a plain discover query', () => {
    const q = new URLSearchParams(
      discoverPath({ genres: '35|16' }).split('?')[1],
    )
    expect(q.get('with_genres')).toBe('35|16')
    expect(q.get('include_adult')).toBe('false')
    expect(q.get('certification.lte')).toBeNull()
  })
  it('restricts kids queries and defaults to family genres', () => {
    const q = new URLSearchParams(discoverPath({ kids: true }).split('?')[1])
    expect(q.get('certification.lte')).toBe('PG')
    expect(q.get('certification.gte')).toBe('G')
    expect(q.get('certification_country')).toBe('US')
    expect(q.get('with_genres')).toBe('16|10751')
  })
  it('keeps chosen genres for kids', () => {
    const q = new URLSearchParams(
      discoverPath({ kids: true, genres: '12' }).split('?')[1],
    )
    expect(q.get('with_genres')).toBe('12')
  })
})

describe('certification', () => {
  const details = (certs: Record<string, string>) =>
    ({
      release_dates: {
        results: Object.entries(certs).map(([iso, certification]) => ({
          iso_3166_1: iso,
          release_dates: [{ certification: '' }, { certification }],
        })),
      },
    }) as unknown as MovieDetails

  it('reads the US certification', () => {
    expect(usCertification(details({ GB: '12A', US: 'PG' }))).toBe('PG')
    expect(usCertification(details({ GB: '12A' }))).toBe('')
  })
  it('allows only family ratings', () => {
    expect(isKidSafe('PG')).toBe(true)
    expect(isKidSafe('PG-13')).toBe(false)
    expect(isKidSafe('NR')).toBe(false)
    expect(isKidSafe('')).toBe(false)
  })
})
