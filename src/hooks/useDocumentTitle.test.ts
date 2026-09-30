import { describe, expect, it } from 'vitest'
import { pageTitle } from './useDocumentTitle'

describe('pageTitle', () => {
  it('formats a page title with the site name', () => {
    expect(pageTitle('My List')).toBe('My List · StreamzGPT')
  })
  it('falls back to the site name while a title is loading', () => {
    expect(pageTitle(undefined)).toBe('StreamzGPT')
    expect(pageTitle(null)).toBe('StreamzGPT')
    expect(pageTitle('')).toBe('StreamzGPT')
  })
})
