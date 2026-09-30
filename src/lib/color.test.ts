import { describe, expect, it } from 'vitest'
import { dominantColor } from './color'

const px = (r: number, g: number, b: number, a = 255) => [r, g, b, a]

describe('dominantColor', () => {
  it('prefers the vivid colour over grey', () => {
    const data = [
      ...px(200, 30, 30),
      ...px(128, 128, 128),
      ...px(128, 128, 128),
    ]
    const [r, g, b] = dominantColor(data)
    expect(r).toBeGreaterThan(g + 20)
    expect(r).toBeGreaterThan(b + 20)
  })
  it('ignores transparent pixels', () => {
    expect(dominantColor([...px(0, 255, 0, 0), ...px(10, 20, 200)])).toEqual([
      10, 20, 200,
    ])
  })
  it('falls back when there is nothing to sample', () => {
    expect(dominantColor([])).toEqual([58, 63, 99])
  })
})
