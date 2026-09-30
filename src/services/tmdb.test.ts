import { describe, expect, it } from 'vitest'
import { imageUrl } from './tmdb'

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
