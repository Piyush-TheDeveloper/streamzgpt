import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { MovieGrid } from '@/components/movie/MovieGrid'
import { useProfile } from '@/features/profiles/ProfileContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { GENRES } from '@/lib/genres'
import { filterResults, uniqueById } from '@/lib/search'
import { cn } from '@/lib/utils'
import {
  discoverMovies,
  getTrendingMovies,
  searchMovies,
} from '@/services/tmdb'

export function SearchPage() {
  const { active } = useProfile()
  const kids = active?.kids ?? false
  const [params, setParams] = useSearchParams()
  const urlQuery = params.get('q') ?? ''
  const genreParam = Number(params.get('genre'))
  const genre = GENRES.some(g => g.id === genreParam) ? genreParam : null

  // The input is local state so typing stays instant; the URL follows, debounced.
  const [text, setText] = useState(urlQuery)
  const debounced = useDebouncedValue(text.trim(), 300)
  useEffect(() => {
    if (debounced === urlQuery) return
    setParams(
      p => {
        if (debounced) p.set('q', debounced)
        else p.delete('q')
        return p
      },
      { replace: true },
    )
  }, [debounced, urlQuery, setParams])

  const mode = urlQuery ? 'search' : genre !== null ? 'genre' : 'trending'
  const query = useInfiniteQuery({
    // Search results are filtered by genre client-side, so genre only keys
    // the discover feed; switching genre on a search costs no request.
    queryKey: ['browse', mode, urlQuery, mode === 'genre' ? genre : null, kids],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      mode === 'search'
        ? searchMovies(urlQuery, pageParam, signal)
        : mode === 'genre'
          ? discoverMovies(
              { genres: String(genre), kids, page: pageParam },
              signal,
            )
          : kids
            ? discoverMovies({ kids: true, page: pageParam }, signal)
            : getTrendingMovies(pageParam, signal),
    getNextPageParam: last =>
      last.page < Math.min(last.total_pages, 500) ? last.page + 1 : undefined,
  })

  const movies = useMemo(() => {
    const all = uniqueById(query.data?.pages.flatMap(p => p.results) ?? [])
    // Discover/trending already respect the genre/kids rules server-side.
    return mode === 'search' ? filterResults(all, { genre, kids }) : all
  }, [query.data, mode, genre, kids])

  // Load the next page as the sentinel nears the viewport. The button below is
  // the keyboard / no-IntersectionObserver path.
  const sentinel = useRef<HTMLDivElement>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasNextPage) return
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && !isFetchingNextPage && void fetchNextPage(),
      { rootMargin: '600px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // A heavily filtered search can yield empty pages; keep fetching until the
  // grid has something (or pages run out).
  useEffect(() => {
    if (
      mode === 'search' &&
      movies.length < 12 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage()
    }
  }, [mode, movies.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  const setGenre = (id: number | null) =>
    setParams(
      p => {
        if (id === null) p.delete('genre')
        else p.set('genre', String(id))
        return p
      },
      { replace: true },
    )

  const heading =
    mode === 'search'
      ? `Results for “${urlQuery}”`
      : mode === 'genre'
        ? GENRES.find(g => g.id === genre)!.name
        : kids
          ? 'Family favourites'
          : 'Trending this week'

  return (
    <div className='mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6'>
      <h1 className='sr-only'>Search</h1>
      <form
        role='search'
        onSubmit={(e: FormEvent) => e.preventDefault()}
        className='relative mx-auto max-w-2xl'
      >
        <label htmlFor='movie-search' className='sr-only'>
          Search movies
        </label>
        <Search
          className='pointer-events-none absolute left-5 top-1/2 z-10 size-5 -translate-y-1/2 text-muted'
          aria-hidden
        />
        <input
          id='movie-search'
          type='search'
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder='Search movies…'
          autoComplete='off'
          enterKeyHint='search'
          className='h-14 w-full appearance-none rounded-full [&::-webkit-search-cancel-button]:appearance-none border border-border bg-surface/80 pl-14 pr-14 text-lg outline-none backdrop-blur placeholder:text-muted focus:border-brand'
        />
        {text && (
          <button
            type='button'
            aria-label='Clear search'
            onClick={() => setText('')}
            className='absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full hover:bg-surface-2'
          >
            <X className='size-5' aria-hidden />
          </button>
        )}
      </form>

      <div
        role='group'
        aria-label='Filter by genre'
        className='mt-6 flex flex-wrap justify-center gap-2'
      >
        <Chip pressed={genre === null} onClick={() => setGenre(null)}>
          All
        </Chip>
        {GENRES.map(g => (
          <Chip
            key={g.id}
            pressed={genre === g.id}
            onClick={() => setGenre(g.id)}
          >
            {g.name}
          </Chip>
        ))}
      </div>

      <section aria-labelledby='results-heading' className='mt-10'>
        <h2 id='results-heading' className='mb-5 text-2xl font-extrabold'>
          {heading}
        </h2>
        <p className='sr-only' role='status' aria-live='polite'>
          {query.isPending
            ? 'Loading results'
            : `${movies.length}${hasNextPage ? '+' : ''} results`}
        </p>

        {query.isError ? (
          <div role='alert' className='space-y-3 py-10 text-center'>
            <p className='text-muted'>{query.error.message}</p>
            <button
              type='button'
              onClick={() => void query.refetch()}
              className='rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-hover'
            >
              Try again
            </button>
          </div>
        ) : query.isPending ? (
          <div
            aria-hidden
            className='grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4'
          >
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className='aspect-2/3 animate-pulse rounded-2xl bg-surface-2'
              />
            ))}
          </div>
        ) : movies.length === 0 && !hasNextPage ? (
          <p className='py-16 text-center text-muted'>
            Nothing found{urlQuery ? ` for “${urlQuery}”` : ''}. Try another
            title{genre !== null ? ' or clear the genre filter' : ''}.
          </p>
        ) : (
          <>
            <MovieGrid movies={movies} />
            {hasNextPage && (
              <div ref={sentinel} className='flex justify-center py-10'>
                <button
                  type='button'
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className='rounded-full border border-border px-6 py-3 text-sm font-medium hover:border-fg disabled:opacity-60'
                >
                  {isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2.5 text-sm font-medium transition-colors',
        pressed
          ? 'border-brand bg-brand text-on-brand'
          : 'border-border bg-surface/60 hover:border-muted',
      )}
    >
      {children}
    </button>
  )
}
