import { describe, expect, it } from 'vitest'
import { formatRuntime, releaseYear } from './format'

describe('format', () => {
  it('formats runtime', () => {
    expect(formatRuntime(135)).toBe('2h 15m')
    expect(formatRuntime(null)).toBeNull()
    expect(formatRuntime(0)).toBeNull()
  })
  it('extracts release year', () => {
    expect(releaseYear('2024-08-30')).toBe('2024')
    expect(releaseYear('')).toBeNull()
  })
})
