import { describe, expect, it } from 'vitest'
import { homeIndex, middleCopy, reelCopies, wrap } from './loop'

describe('loop helpers', () => {
  it('wraps negative and overflowing indexes', () => {
    expect(wrap(-1, 10)).toBe(9)
    expect(wrap(10, 10)).toBe(0)
    expect(wrap(23, 10)).toBe(3)
    expect(wrap(0, 10)).toBe(0)
  })
  it('only loops when there are enough items to fill the screen', () => {
    expect(reelCopies(10)).toBe(3)
    expect(reelCopies(4)).toBe(3)
    expect(reelCopies(3)).toBe(1)
    expect(middleCopy(3)).toBe(1)
    expect(middleCopy(1)).toBe(0)
  })
  it('maps any copy back to the same item in the middle copy', () => {
    expect(homeIndex(2, 10, 3)).toBe(12) // first copy
    expect(homeIndex(12, 10, 3)).toBe(12) // already home
    expect(homeIndex(27, 10, 3)).toBe(17) // last copy
    expect(homeIndex(7, 10, 1)).toBe(7) // no looping
  })
})
