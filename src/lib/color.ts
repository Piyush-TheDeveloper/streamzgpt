export type RGB = [number, number, number]

/**
 * Average a flat RGBA pixel buffer, weighting saturated, mid-brightness pixels
 * so the result is a vivid "poster colour" rather than a muddy grey.
 */
export function dominantColor(data: ArrayLike<number>): RGB {
  let r = 0
  let g = 0
  let b = 0
  let total = 0
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const max = Math.max(data[i], data[i + 1], data[i + 2])
    const min = Math.min(data[i], data[i + 1], data[i + 2])
    const saturation = max === 0 ? 0 : (max - min) / max
    const lightness = (max + min) / 510
    const weight = 0.05 + saturation * (1 - Math.abs(lightness - 0.5) * 1.6)
    r += data[i] * weight
    g += data[i + 1] * weight
    b += data[i + 2] * weight
    total += weight
  }
  if (total === 0) return [58, 63, 99]
  return [Math.round(r / total), Math.round(g / total), Math.round(b / total)]
}

export const toCss = ([r, g, b]: RGB) => `rgb(${r} ${g} ${b})`

const cache = new Map<string, RGB>()

/** Samples a tiny downscaled copy of the image. Resolves null if it can't. */
export function sampleImageColor(url: string): Promise<RGB | null> {
  const hit = cache.get(url)
  if (hit) return Promise.resolve(hit)
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 16
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0, 16, 16)
        const color = dominantColor(ctx.getImageData(0, 0, 16, 16).data)
        cache.set(url, color)
        resolve(color)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}
