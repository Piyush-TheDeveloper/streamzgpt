import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Layer {
  id: number
  src: string
}

function BackdropImage({ src }: { src: string }) {
  // Invisible until decoded, so a slow download fades in instead of popping.
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={src}
      alt=''
      decoding='async'
      onLoad={() => setLoaded(true)}
      className={cn(
        'absolute inset-0 size-full scale-110 object-cover blur-[22px] saturate-150 transition-opacity duration-700 will-change-[opacity]',
        loaded ? 'opacity-60' : 'opacity-0',
      )}
    />
  )
}

/**
 * Heavily blurred, dimmed copy of the focused film's artwork that crossfades
 * whenever `src` changes. Only opacity animates; the blur is baked into each
 * layer, so it stays cheap. Decorative (aria-hidden).
 */
export function BlurBackdrop({ src }: { src: string | null }) {
  const [layers, setLayers] = useState<Layer[]>([])
  const [last, setLast] = useState<string | null>(null)

  // Adjust state during render when the source changes (no effect, no flash).
  if (src !== last) {
    setLast(src)
    if (src) {
      // Keep two older layers so the page never shows through while a new
      // image is still loading.
      setLayers(prev => [
        ...prev.slice(-2),
        { id: (prev.at(-1)?.id ?? 0) + 1, src },
      ])
    }
  }

  return (
    <div
      aria-hidden
      className='pointer-events-none absolute inset-x-0 -top-24 bottom-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,black_65%,transparent)]'
    >
      {layers.map(l => (
        <BackdropImage key={l.id} src={l.src} />
      ))}
      <div className='absolute inset-0 bg-bg/45' />
    </div>
  )
}
