import { useState } from 'react'
import { Play } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { getMovieDetails, pickTrailer } from '@/services/tmdb'
import { useProfile } from '@/features/profiles/ProfileContext'
import { TrailerModal } from './TrailerModal'

type State =
  | { status: 'idle' | 'loading' | 'none' | 'error' }
  | { status: 'open'; key: string }

export function TrailerButton({
  movieId,
  title,
  className,
}: {
  movieId: number
  title: string
  className?: string
}) {
  const queryClient = useQueryClient()
  const { active } = useProfile()
  const [state, setState] = useState<State>({ status: 'idle' })

  // Videos are fetched on click, not on mount, so the home hero doesn't pay
  // for the full details request. The result is cached for the detail page.
  async function play() {
    setState({ status: 'loading' })
    try {
      const details = await queryClient.fetchQuery({
        queryKey: ['movie', movieId],
        queryFn: ({ signal }) => getMovieDetails(movieId, signal),
      })
      const trailer = pickTrailer(details.videos.results)
      setState(
        trailer ? { status: 'open', key: trailer.key } : { status: 'none' },
      )
    } catch {
      setState({ status: 'error' })
    }
  }

  const label = {
    idle: 'Play trailer',
    loading: 'Loading…',
    none: 'No trailer available',
    error: 'Couldn’t load — retry',
    open: 'Play trailer',
  }[state.status]

  return (
    <>
      <button
        type='button'
        disabled={state.status === 'loading' || state.status === 'none'}
        onClick={play}
        className={className}
      >
        <Play className='size-5 fill-current' aria-hidden />
        {label}
      </button>
      {state.status === 'open' && (
        <TrailerModal
          youtubeKey={state.key}
          title={title}
          autoplay={active?.autoplayTrailers ?? true}
          onClose={() => setState({ status: 'idle' })}
        />
      )}
    </>
  )
}
