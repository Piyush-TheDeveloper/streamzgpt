import { describe, expect, it } from 'vitest'
import {
  detectRegion,
  findRegion,
  LANGUAGES,
  REGIONS,
  regionName,
} from './regions'

describe('regions', () => {
  it('detects a supported region from the locale, else defaults to India', () => {
    expect(detectRegion('en-IN')).toBe('IN')
    expect(detectRegion('en-gb')).toBe('GB')
    expect(detectRegion('pt_BR')).toBe('BR')
    expect(detectRegion('en-AU')).toBe('IN')
    expect(detectRegion('en')).toBe('IN')
    expect(detectRegion(undefined)).toBe('IN')
  })
  it('names regions, including worldwide', () => {
    expect(regionName('IN')).toBe('India')
    expect(regionName('ALL')).toBe('the world')
  })
  it('has a display name for every language it lists', () => {
    for (const r of REGIONS)
      for (const l of r.languages) expect(LANGUAGES[l], l).toBeTruthy()
    expect(findRegion('XX')).toBeUndefined()
  })
})
