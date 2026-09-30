import { Link } from 'react-router'
import { MovieGrid } from '@/components/movie/MovieGrid'
import { useProfile } from '@/features/profiles/ProfileContext'
import { useWatchlist } from '@/features/watchlist/useWatchlist'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function MyListPage() {
  useDocumentTitle('My List')
  const { active } = useProfile()
  const { movies, status, refetch } = useWatchlist()

  return (
    <div className='mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6'>
      <h1 className='text-4xl font-extrabold sm:text-5xl'>My List</h1>
      <p className='mt-2 text-muted'>
        Saved by {active?.name}. Only this profile sees it.
      </p>

      <div className='mt-10' aria-busy={status === 'loading'}>
        {status === 'error' ? (
          <div role='alert' className='space-y-3 py-10'>
            <p className='text-muted'>Couldn’t load your list.</p>
            <button
              type='button'
              onClick={() => void refetch()}
              className='rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-hover'
            >
              Try again
            </button>
          </div>
        ) : status === 'loading' ? (
          <div
            aria-hidden
            className='grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4'
          >
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className='aspect-2/3 animate-pulse rounded-2xl bg-surface-2'
              />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className='rounded-3xl border border-dashed border-border px-6 py-16 text-center'>
            <p className='text-xl font-semibold'>Nothing saved yet</p>
            <p className='mt-2 text-muted'>
              Tap the bookmark on any film to keep it here.
            </p>
            <Link
              to='/search'
              className='mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-on-brand hover:bg-brand-hover'
            >
              Find something to watch
            </Link>
          </div>
        ) : (
          <>
            <p className='sr-only' role='status'>
              {movies.length} saved titles
            </p>
            <MovieGrid movies={movies} />
          </>
        )}
      </div>
    </div>
  )
}
