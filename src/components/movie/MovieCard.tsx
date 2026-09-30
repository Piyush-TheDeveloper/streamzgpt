import type { MouseEvent } from 'react'
import { Link } from 'react-router'
import { Star } from 'lucide-react'
import { imageUrl } from '@/services/tmdb'
import { releaseYear } from '@/lib/format'
import type { Movie } from '@/types/movie'

export function MovieCard({ movie }: { movie: Movie }) {
  const poster = imageUrl(movie.poster_path, 'w342')
  const year = releaseYear(movie.release_date)

  // Name the poster only at click time so duplicates on the page (the same
  // film can appear in several rows) never clash in the view transition.
  const nameForTransition = (e: MouseEvent<HTMLAnchorElement>) => {
    const img = e.currentTarget.querySelector('img')
    if (img) img.style.viewTransitionName = `poster-${movie.id}`
  }

  return (
    <Link
      to={`/movie/${movie.id}`}
      viewTransition
      onClick={nameForTransition}
      className='group block w-36 shrink-0 sm:w-44'
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
