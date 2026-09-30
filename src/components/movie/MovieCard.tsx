import type { MouseEvent } from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { getMovieDetails, imageUrl } from '@/services/tmdb'
import { releaseYear } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Movie } from '@/types/movie'

export function MovieCard({
  movie,
  className = 'w-36 shrink-0 sm:w-44',
}: {
  movie: Movie
  className?: string
}) {
  const queryClient = useQueryClient()
  const poster = imageUrl(movie.poster_path, 'w342')
  const year = releaseYear(movie.release_date)

  // Warm the detail cache so the page (and its poster) renders immediately,
  // which is what lets the poster morph land on a real element.
  const prefetch = () =>
    void queryClient.prefetchQuery({
      queryKey: ['movie', movie.id],
      queryFn: ({ signal }) => getMovieDetails(movie.id, signal),
    })

  // Name the poster only for a plain click, and only briefly, so duplicates on
  // the page (one film in several rows) never clash in the view transition.
  const nameForTransition = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return
    const img = e.currentTarget.querySelector('img')
    if (!img) return
    img.style.viewTransitionName = `poster-${movie.id}`
    window.setTimeout(() => (img.style.viewTransitionName = ''), 1000)
  }

  return (
    <Link
      to={`/movie/${movie.id}`}
      viewTransition
      onClick={nameForTransition}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      className={cn('group block', className)}
    >
      <div className='relative aspect-2/3 overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-border transition duration-300 ease-out group-hover:-translate-y-1.5 group-hover:ring-brand group-focus-visible:-translate-y-1.5'>
        {poster ? (
          <img
            src={poster}
            alt=''
            loading='lazy'
            className='size-full object-cover'
          />
        ) : (
          <div className='flex size-full items-center justify-center p-2 text-center text-xs text-muted'>
            {movie.title}
          </div>
        )}
        <span className='absolute left-2 top-2 flex items-center gap-1 rounded-full bg-bg/80 px-2 py-1 text-xs font-semibold backdrop-blur'>
          <Star className='size-3 fill-brand text-brand' aria-hidden />
          <span className='sr-only'>Rated</span>
          {movie.vote_average.toFixed(1)}
        </span>
      </div>
      <h3 className='mt-2.5 truncate text-sm font-semibold'>{movie.title}</h3>
      {year && <p className='text-xs text-muted'>{year}</p>}
    </Link>
  )
}
