import { describe, expect, it } from 'vitest'
import { genreParam, MOODS } from './moods'

describe('moods', () => {
  it('joins genres with OR', () => {
    expect(genreParam([35, 16])).toBe('35|16')
  })
  it('has unique ids and at least one genre each', () => {
    expect(new Set(MOODS.map(m => m.id)).size).toBe(MOODS.length)
    expect(MOODS.every(m => m.genres.length > 0)).toBe(true)
  })
})
