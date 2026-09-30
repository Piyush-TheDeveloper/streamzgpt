import { Link } from 'react-router'
import { Star } from 'lucide-react'
import { imageUrl } from '@/services/tmdb'
import type { Movie } from '@/types/movie'

export function MovieCard({ movie }: { movie: Movie }) {
  const poster = imageUrl(movie.poster_path, 'w342')
  return (
    <Link
      to={`/movie/${movie.id}`}
      className='group block w-36 shrink-0 rounded-lg sm:w-44'
    >
      <div className='relative aspect-2/3 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-border transition group-hover:scale-105 group-hover:ring-brand'>
        {poster ? (
          <img
            src={poster}
            alt={movie.title}
            loading='lazy'
            className='size-full object-cover'
          />
        ) : (
          <div className='flex size-full items-center justify-center p-2 text-center text-xs text-muted'>
            {movie.title}
          </div>
        )}
      </div>
      <h3 className='mt-2 truncate text-sm font-medium'>{movie.title}</h3>
      <p className='flex items-center gap-1 text-xs text-muted'>
        <Star className='size-3 fill-yellow-400 text-yellow-400' aria-hidden />
        {movie.vote_average.toFixed(1)}
        {movie.release_date && ` · ${movie.release_date.slice(0, 4)}`}
      </p>
    </Link>
  )
}
