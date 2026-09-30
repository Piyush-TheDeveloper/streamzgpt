import { useState } from 'react'
import { Play } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getMovieDetails, pickTrailer } from '@/services/tmdb'
import { TrailerModal } from './TrailerModal'

export function TrailerButton({
  movieId,
  title,
  className,
}: {
  movieId: number
  title: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  // Shares the detail-page cache entry, so opening a trailer from the hero
  // and then the detail page costs one request.
  const { data, isPending } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: ({ signal }) => getMovieDetails(movieId, signal),
  })
  const trailer = data ? pickTrailer(data.videos.results) : null

  return (
    <>
      <button
        type='button'
        disabled={isPending || !trailer}
        onClick={() => setOpen(true)}
        className={className}
      >
        <Play className='size-5 fill-current' aria-hidden />
        {isPending ? 'Loading…' : trailer ? 'Play trailer' : 'No trailer'}
      </button>
      {open && trailer && (
        <TrailerModal
          youtubeKey={trailer.key}
          title={title}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
