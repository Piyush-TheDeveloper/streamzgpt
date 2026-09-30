import { describe, expect, it } from 'vitest'
import { imageUrl, pickTrailer } from './tmdb'
import type { Video } from '@/types/movie'

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
