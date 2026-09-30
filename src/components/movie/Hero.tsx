import { Link } from 'react-router'
import { Info } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getMoviesByCategory, imageUrl } from '@/services/tmdb'
import { heroButtons } from './buttonStyles'
import { TrailerButton } from './TrailerButton'

export function Hero() {
  const { data, isPending } = useQuery({
    queryKey: ['movies', 'now_playing'],
    queryFn: ({ signal }) => getMoviesByCategory('now_playing', signal),
  })
  const movie = data?.results.find(m => m.backdrop_path)

  if (isPending) {
    return <div className='h-[60vh] min-h-96 animate-pulse bg-surface' />
  }
  if (!movie) return null

  return (
    <section
      aria-label='Featured movie'
      className='relative flex h-[60vh] min-h-96 items-end overflow-hidden'
    >
      <img
        src={imageUrl(movie.backdrop_path, 'original') ?? ''}
        alt=''
        className='absolute inset-0 size-full object-cover'
      />
      <div className='absolute inset-0 bg-linear-to-t from-bg via-bg/50 to-transparent' />
      <div className='absolute inset-0 bg-linear-to-r from-bg/80 to-transparent' />
      <div className='relative mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6'>
        <h1 className='max-w-2xl text-3xl font-extrabold sm:text-5xl'>
          {movie.title}
        </h1>
        <p className='mt-3 line-clamp-3 max-w-xl text-sm text-fg/80 sm:text-base'>
          {movie.overview}
        </p>
        <div className='mt-5 flex flex-wrap gap-3'>
          <TrailerButton
            movieId={movie.id}
            title={movie.title}
            className={`${heroButtons} bg-fg text-bg hover:bg-fg/85`}
          />
          <Link
            to={`/movie/${movie.id}`}
            className={`${heroButtons} bg-surface-2/80 hover:bg-surface-2`}
          >
            <Info className='size-5' aria-hidden />
            More info
          </Link>
        </div>
      </div>
    </section>
  )
}
