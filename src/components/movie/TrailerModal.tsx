import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function TrailerModal({
  youtubeKey,
  title,
  autoplay = true,
  onClose,
}: {
  youtubeKey: string
  title: string
  autoplay?: boolean
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    // No cleanup: unmounting removes the dialog from the top layer, and calling
    // close() here would fire onClose (and re-close us) under StrictMode.
    if (ref.current && !ref.current.open) ref.current.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-label={`${title} trailer`}
      onClose={onClose}
      onClick={e => e.target === ref.current && onClose()}
      className='m-auto w-[min(92vw,1000px)] rounded-xl bg-black p-0 text-fg backdrop:bg-black/80'
    >
      <button
        type='button'
        onClick={onClose}
        aria-label='Close trailer'
        className='absolute right-2 top-2 z-10 rounded-full bg-black/70 p-2 hover:bg-black'
      >
        <X className='size-5' aria-hidden />
      </button>
      <div className='aspect-video'>
        <iframe
          className='size-full rounded-xl'
          src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=${autoplay ? 1 : 0}&rel=0`}
          title={`${title} trailer`}
          allow='autoplay; encrypted-media; picture-in-picture; fullscreen'
          allowFullScreen
        />
      </div>
    </dialog>
  )
}
