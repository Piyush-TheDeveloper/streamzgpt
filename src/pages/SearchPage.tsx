import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useSearchParams } from 'react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { MovieGrid } from '@/components/movie/MovieGrid'
import { useProfile } from '@/features/profiles/ProfileContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { GENRES } from '@/lib/genres'
import { isoDaysAgo } from '@/lib/dates'
import { SORT_LABELS, sortOptions, type SortMode } from '@/lib/feeds'
import { LANGUAGES, REGIONS, regionName, WORLDWIDE } from '@/lib/regions'
import { filterResults, matchesTitle, uniqueById } from '@/lib/search'
import { cn } from '@/lib/utils'
import {
  discoverMovies,
  getTrendingMovies,
  searchMovies,
} from '@/services/tmdb'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

type Mode = 'search' | 'browse'

interface Filters {
  q: string
  genre: number | null
  country: string
  language: string | null
  sort: SortMode
  kids: boolean
  /** Fixed per page-session so every page of a query shares one date window. */
  now: Date
}

// Stop auto-paging for sparse results after this many pages; "Load more"
// still works beyond it.
const AUTO_PAGES = 5
const KIDS_AUTO_PAGES = 10

async function fetchPage(
  mode: Mode,
  f: Filters,
  page: number,
  signal: AbortSignal,
) {
  const country = f.country === WORLDWIDE ? undefined : f.country
  if (mode === 'search') {
    if (!f.kids) return searchMovies(f.q, page, signal)
    // TMDB search can't filter by certification, so kids search only looks
    // inside the kid-safe catalogue.
    const res = await discoverMovies({ kids: true, country, page }, signal)
    return { ...res, results: matchesTitle(res.results, f.q) }
  }
  // Nothing narrowed down: TMDB's own worldwide trending list.
  if (
    !country &&
    !f.language &&
    f.genre === null &&
    f.sort === 'trending' &&
    !f.kids
  ) {
    return getTrendingMovies(page, signal)
  }
  return discoverMovies(
    {
      ...sortOptions(f.sort, f.now),
      genres: f.genre === null ? undefined : String(f.genre),
      country,
      language: f.language ?? undefined,
      kids: f.kids,
      page,
    },
    signal,
  )
}

const SORTS = Object.keys(SORT_LABELS) as SortMode[]

export function SearchPage() {
  useDocumentTitle('Search')
  const { active } = useProfile()
  const kids = active?.kids ?? false
  const [params, setParams] = useSearchParams()
  const urlQuery = params.get('q') ?? ''
  const genreParam = Number(params.get('genre'))
  const genre = GENRES.some(g => g.id === genreParam) ? genreParam : null
  const countryParam = params.get('country')
  const country =
    countryParam === WORLDWIDE || REGIONS.some(r => r.code === countryParam)
      ? countryParam!
      : (active?.region ?? WORLDWIDE)
  const langParam = params.get('lang')
  const language =
    langParam && Object.hasOwn(LANGUAGES, langParam) ? langParam : null
  const sortParam = params.get('sort') as SortMode | null
  const sort: SortMode =
    sortParam && SORTS.includes(sortParam) ? sortParam : 'trending'
  const [now] = useState(() => new Date())
  const filters: Filters = {
    q: urlQuery,
    genre,
    country,
    language,
    sort,
    kids,
    now,
  }

  // The input is local state so typing stays instant; the URL follows, debounced.
  const [text, setText] = useState(urlQuery)
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery)
  const inputRef = useRef<HTMLInputElement>(null)
  // Back/forward or a link changed ?q=: pull it into the input.
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery)
    setText(urlQuery)
  }
  const trimmed = text.trim()
  const debounced = useDebouncedValue(trimmed, 300)
  const setUrlQuery = (value: string) =>
    setParams(
      p => {
        if (value) p.set('q', value)
        else p.delete('q')
        return p
      },
      { replace: true },
    )
  useEffect(() => {
    // Only push when typing has settled, so an external URL change isn't undone.
    if (debounced !== trimmed || debounced === urlQuery) return
    setUrlQuery(debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, trimmed, urlQuery])

  const mode: Mode = urlQuery ? 'search' : 'browse'
  const query = useInfiniteQuery({
    // A text search is filtered by genre/language client-side, so only browsing
    // keys the server filters; switching them during a search costs no request.
    queryKey:
      mode === 'search'
        ? ['search-page', 'search', urlQuery, kids, kids ? country : null]
        : [
            'search-page',
            'browse',
            country,
            language,
            genre,
            sort,
            kids,
            isoDaysAgo(0, now),
          ],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchPage(mode, filters, pageParam, signal),
    getNextPageParam: last =>
      last.page < Math.min(last.total_pages, 500) ? last.page + 1 : undefined,
  })

  const movies = useMemo(() => {
    const all = uniqueById(query.data?.pages.flatMap(p => p.results) ?? [])
    // Discover/trending already respect the genre/kids rules server-side.
    return mode === 'search' ? filterResults(all, { genre }) : all
  }, [query.data, mode, genre])

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

  // A heavily filtered search can yield near-empty pages; keep fetching for a
  // bounded number of pages (never after an error) until the grid has content.
  const pageCount = query.data?.pages.length ?? 0
  const { isError } = query
  useEffect(() => {
    const budget = kids ? KIDS_AUTO_PAGES : AUTO_PAGES
    if (
      mode === 'search' &&
      !isError &&
      movies.length < 12 &&
      pageCount < budget &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage()
    }
  }, [
    mode,
    kids,
    isError,
    movies.length,
    pageCount,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ])

  const setParam = (key: string, value: string | null) =>
    setParams(
      p => {
        if (value === null) p.delete(key)
        else p.set(key, value)
        return p
      },
      { replace: true },
    )
  const setGenre = (id: number | null) =>
    setParam('genre', id === null ? null : String(id))

  const heading =
    mode === 'search'
      ? `Results for “${urlQuery}”${kids ? ' in kid-safe titles' : ''}`
      : kids && !language && genre === null
        ? `Family favourites${country === WORLDWIDE ? '' : ` in ${regionName(country)}`}`
        : `${SORT_LABELS[sort]} · ${
            genre === null ? '' : `${GENRES.find(g => g.id === genre)!.name} `
          }${language ? `${LANGUAGES[language]} ` : ''}movies ${
            country === WORLDWIDE ? 'worldwide' : `in ${regionName(country)}`
          }`

  return (
    <div className='mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6'>
      <h1 className='sr-only'>Search</h1>
      <form
        role='search'
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          // Submit applies immediately and dismisses the mobile keyboard.
          setUrlQuery(trimmed)
          inputRef.current?.blur()
        }}
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
          ref={inputRef}
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
            onClick={() => {
              setText('')
              setUrlQuery('')
              inputRef.current?.focus()
            }}
            className='absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full hover:bg-surface-2'
          >
            <X className='size-5' aria-hidden />
          </button>
        )}
      </form>

      <div className='mt-6 flex flex-wrap justify-center gap-3'>
        <FilterSelect
          label='Country'
          value={country}
          // Text search can't filter by country (TMDB search results carry none).
          disabled={mode === 'search' && !kids}
          onChange={v => setParam('country', v)}
        >
          <option value={WORLDWIDE}>Worldwide</option>
          {REGIONS.map(r => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label='Language'
          value={language ?? ''}
          disabled={mode === 'search'}
          onChange={v => setParam('lang', v || null)}
        >
          <option value=''>All languages</option>
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label='Sort by'
          value={sort}
          disabled={mode === 'search'}
          onChange={v => setParam('sort', v === 'trending' ? null : v)}
        >
          {SORTS.map(m => (
            <option key={m} value={m}>
              {SORT_LABELS[m]}
            </option>
          ))}
        </FilterSelect>
      </div>
      {mode === 'search' && (
        <p className='mt-2 text-center text-xs text-muted'>
          Country and sort apply when browsing. Clear the search box to use
          them.
        </p>
      )}

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
            title
            {genre !== null || (mode === 'browse' && language)
              ? ' or relax the filters'
              : ''}
            .
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

function FilterSelect({
  label,
  value,
  disabled,
  onChange,
  children,
}: {
  label: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  const id = useId()
  return (
    <div className='flex items-center gap-2'>
      <label htmlFor={id} className='text-sm text-muted'>
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className='h-11 rounded-full border border-border bg-surface/70 px-4 text-sm outline-none focus:border-brand disabled:opacity-50'
      >
        {children}
      </select>
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
