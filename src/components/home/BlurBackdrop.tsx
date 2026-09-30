import { useState } from 'react'

interface Layer {
  id: number
  src: string
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
      setLayers(prev => [
        ...prev.slice(-1),
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
        <img
          key={l.id}
          src={l.src}
          alt=''
          decoding='async'
          className='fade-in absolute inset-0 size-full scale-125 object-cover opacity-60 blur-[48px] saturate-150 will-change-[opacity]'
        />
      ))}
      <div className='absolute inset-0 bg-bg/35' />
    </div>
  )
}
