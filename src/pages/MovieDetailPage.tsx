import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Clock, Star } from 'lucide-react'
import { TrailerButton } from '@/components/movie/TrailerButton'
import { WatchlistButton } from '@/components/movie/WatchlistButton'
import { MovieCard } from '@/components/movie/MovieCard'
import { heroButtons } from '@/components/movie/buttonStyles'
import { formatRuntime, releaseYear } from '@/lib/format'
import { useProfile } from '@/features/profiles/ProfileContext'
import {
  getMovieDetails,
  getRecommendedMovies,
  imageUrl,
  isKidSafeMovie,
  TmdbError,
} from '@/services/tmdb'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function MovieDetailPage() {
  const { active } = useProfile()
  const id = Number(useParams().id)
  const valid = Number.isInteger(id) && id > 0

  const details = useQuery({
    queryKey: ['movie', id],
    queryFn: ({ signal }) => getMovieDetails(id, signal),
    enabled: valid,
  })
  const similar = useQuery({
    queryKey: ['movie', id, 'similar'],
    queryFn: ({ signal }) => getRecommendedMovies(id, signal),
    enabled: valid,
  })

  useDocumentTitle(details.data?.title)

  if (!valid || details.isError) {
    const notFound =
      !valid ||
      (details.error instanceof TmdbError && details.error.status === 404)
    return (
      <div className='mx-auto max-w-7xl px-4 py-24 text-center sm:px-6'>
        <h1 className='text-2xl font-bold'>
          {notFound ? 'Movie not found' : 'Couldn’t load this movie'}
        </h1>
        {!notFound && (
          <>
            <p className='mt-2 text-muted'>{details.error?.message}</p>
            <button
              type='button'
              onClick={() => details.refetch()}
              className='mt-4 rounded-md bg-brand text-on-brand px-4 py-2 text-sm font-semibold hover:bg-brand-hover'
            >
              Try again
            </button>
          </>
        )}
        <Link to='/' className='mt-4 block text-brand hover:underline'>
          Back home
        </Link>
      </div>
    )
  }
  if (details.isPending) {
    return <div className='h-[70vh] animate-pulse bg-surface' />
  }

  const m = details.data
  if (active?.kids && !isKidSafeMovie(m)) {
    return (
      <div className='mx-auto max-w-7xl px-4 py-24 text-center sm:px-6'>
        <h1 className='text-2xl font-bold'>Not available on this profile</h1>
        <p className='mt-2 text-muted'>This title isn’t rated for kids.</p>
        <Link to='/' className='mt-4 block text-brand hover:underline'>
          Back home
        </Link>
      </div>
    )
  }
  const poster = imageUrl(m.poster_path, 'w500')
  const runtime = formatRuntime(m.runtime)
  const year = releaseYear(m.release_date)
  const cast = m.credits.cast.slice(0, 10)

  return (
    <article>
      <div className='relative'>
        {m.backdrop_path && (
          <img
            src={imageUrl(m.backdrop_path, 'original') ?? ''}
            alt=''
            className='absolute inset-0 size-full object-cover opacity-30'
          />
        )}
        <div className='absolute inset-0 bg-linear-to-t from-bg to-transparent' />
        <div className='relative mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-10 pt-28 sm:px-6 md:flex-row'>
          {poster && (
            <img
              src={poster}
              alt={`${m.title} poster`}
              style={{ viewTransitionName: `poster-${m.id}` }}
              className='w-48 shrink-0 self-center rounded-xl ring-1 ring-border md:w-64 md:self-start'
            />
          )}
          <div className='space-y-4'>
            <h1 className='text-3xl font-extrabold sm:text-4xl'>
              {m.title}
              {year && (
                <span className='font-normal text-muted'> ({year})</span>
              )}
            </h1>
            {m.tagline && <p className='italic text-muted'>{m.tagline}</p>}
            <div className='flex flex-wrap items-center gap-4 text-sm'>
              <span className='flex items-center gap-1'>
                <Star className='size-4 fill-brand text-brand' aria-hidden />
                {m.vote_average.toFixed(1)}
              </span>
              {runtime && (
                <span className='flex items-center gap-1 text-muted'>
                  <Clock className='size-4' aria-hidden />
                  {runtime}
                </span>
              )}
            </div>
            <ul className='flex flex-wrap gap-2'>
              {m.genres.map(g => (
                <li
                  key={g.id}
                  className='rounded-full border border-border px-3 py-1 text-xs text-muted'
                >
                  {g.name}
                </li>
              ))}
            </ul>
            <p className='max-w-2xl leading-relaxed text-fg/90'>{m.overview}</p>
            <div className='flex flex-wrap gap-3'>
              <TrailerButton
                movieId={m.id}
                title={m.title}
                className={`${heroButtons} bg-brand text-on-brand hover:bg-brand-hover`}
              />
              <WatchlistButton movie={m} variant='full' />
            </div>
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-7xl space-y-10 px-4 pb-12 sm:px-6'>
        {cast.length > 0 && (
          <section aria-label='Cast' className='space-y-3'>
            <h2 className='text-lg font-semibold'>Cast</h2>
            <ul className='scrollbar-none flex gap-4 overflow-x-auto py-1'>
              {cast.map(c => (
                <li key={c.id} className='w-28 shrink-0 text-center'>
                  <div className='aspect-square overflow-hidden rounded-full bg-surface-2 ring-1 ring-border'>
                    {c.profile_path && (
                      <img
                        src={imageUrl(c.profile_path, 'w342') ?? ''}
                        alt=''
                        loading='lazy'
                        className='size-full object-cover'
                      />
                    )}
                  </div>
                  <p className='mt-2 truncate text-sm font-medium'>{c.name}</p>
                  <p className='truncate text-xs text-muted'>{c.character}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {!active?.kids && similar.data && similar.data.results.length > 0 && (
          <section aria-label='More like this' className='space-y-3'>
            <h2 className='text-lg font-semibold'>More like this</h2>
            <div className='scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 py-4 sm:-mx-6 sm:px-6'>
              {similar.data.results.map(s => (
                <MovieCard key={s.id} movie={s} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
