import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Info, Star } from 'lucide-react'
import { TrailerButton } from '@/components/movie/TrailerButton'
import { heroButtons } from '@/components/movie/buttonStyles'
import { useAmbientFromImage } from '@/hooks/useAmbientFromImage'
import { prefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { releaseYear } from '@/lib/format'
import type { Feed } from '@/lib/feeds'
import { imageUrl } from '@/services/tmdb'

export function Spotlight({ feed }: { feed: Feed }) {
  const navigate = useNavigate()
  const { data, isPending, error } = useQuery({
    queryKey: feed.key,
    queryFn: ({ signal }) => feed.fetch(signal),
  })
  const movies = useMemo(
    () => data?.results.filter(m => m.poster_path).slice(0, 10) ?? [],
    [data],
  )
  const [active, setActive] = useState(0)
  // Tracks where we're heading so rapid key presses don't reuse a stale index
  // while a smooth scroll is still settling (the observer fires for every
  // poster the scroll passes, so it only wins once scrolling has been idle).
  const target = useRef(0)
  const navigating = useRef(false)
  const navTimer = useRef<number>(undefined)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const current = movies[active]

  useAmbientFromImage(imageUrl(current?.poster_path ?? null, 'w92'))

  // Whichever poster crosses the centre line of the reel becomes active.
  const reelRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const root = reelRef.current
    if (!root || movies.length === 0) return
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.index)
            if (!navigating.current) target.current = i
            setActive(i)
          }
        }
      },
      { root, rootMargin: '0px -49% 0px -49%' },
    )
    itemRefs.current.forEach(el => el && io.observe(el.parentElement!))
    return () => io.disconnect()
  }, [movies])

  useEffect(() => () => window.clearTimeout(navTimer.current), [])

  const center = (i: number) => {
    const el = itemRefs.current[i]
    if (!el) return
    el.parentElement!.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }
  const go = (delta: number) => {
    const next = Math.min(
      movies.length - 1,
      Math.max(0, target.current + delta),
    )
    target.current = next
    navigating.current = true
    window.clearTimeout(navTimer.current)
    navTimer.current = window.setTimeout(
      () => (navigating.current = false),
      900,
    )
    center(next)
    itemRefs.current[next]?.focus({ preventScroll: true })
  }
  const onKeyDown = (e: KeyboardEvent) => {
    const delta =
      e.key === 'ArrowRight'
        ? 1
        : e.key === 'ArrowLeft'
          ? -1
          : e.key === 'Home'
            ? -target.current
            : e.key === 'End'
              ? movies.length
              : 0
    if (delta === 0) return
    e.preventDefault()
    go(delta)
  }

  if (error) {
    return (
      <p role='alert' className='px-4 py-16 text-center text-muted'>
        {error.message}
      </p>
    )
  }
  if (isPending) {
    return (
      <div className='mx-auto h-[28rem] max-w-md animate-pulse rounded-3xl bg-surface' />
    )
  }
  if (!current) return null

  return (
    <section
      aria-roledescription='carousel'
      aria-label='Now playing spotlight'
      className='relative'
    >
      <h1 className='sr-only'>StreamzGPT — now playing</h1>
      <div className='relative'>
        <ul
          ref={reelRef}
          style={{ perspective: '900px' }}
          onKeyDown={onKeyDown}
          className='scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto px-[calc(50%-6rem)] py-8 sm:px-[calc(50%-8rem)]'
        >
          {movies.map((m, i) => (
            <li
              key={m.id}
              data-index={i}
              className='reel-item w-48 shrink-0 snap-center sm:w-64'
              aria-roledescription='slide'
              aria-label={`${i + 1} of ${movies.length}`}
            >
              <button
                ref={el => void (itemRefs.current[i] = el)}
                type='button'
                tabIndex={i === active ? 0 : -1}
                aria-current={i === active}
                onClick={() =>
                  i === active ? navigate(`/movie/${m.id}`) : center(i)
                }
                className='block aspect-2/3 w-full overflow-hidden rounded-3xl bg-surface-2 shadow-2xl shadow-black/60 ring-1 ring-white/10'
              >
                <img
                  src={imageUrl(m.poster_path, 'w500') ?? ''}
                  alt={m.title}
                  className='size-full object-cover'
                  draggable={false}
                  fetchPriority={i < 3 ? 'high' : 'auto'}
                />
              </button>
            </li>
          ))}
        </ul>
        <div className='pointer-events-none absolute inset-y-0 left-2 right-2 hidden items-center justify-between sm:flex'>
          <RoundButton
            label='Previous movie'
            onClick={() => go(-1)}
            atEnd={active === 0}
          >
            <ChevronLeft className='size-6' aria-hidden />
          </RoundButton>
          <RoundButton
            label='Next movie'
            onClick={() => go(1)}
            atEnd={active === movies.length - 1}
          >
            <ChevronRight className='size-6' aria-hidden />
          </RoundButton>
        </div>
      </div>

      <p className='sr-only' aria-live='polite'>
        {current.title}, {active + 1} of {movies.length}
      </p>
      <div
        key={current.id}
        className='rise-in mx-auto max-w-2xl px-4 text-center'
      >
        <h2 className='text-3xl font-extrabold sm:text-5xl'>{current.title}</h2>
        <p className='mt-2 flex items-center justify-center gap-3 text-sm text-muted'>
          <span className='flex items-center gap-1'>
            <Star className='size-4 fill-brand text-brand' aria-hidden />
            <span className='sr-only'>Rated</span>
            {current.vote_average.toFixed(1)}
          </span>
          {releaseYear(current.release_date)}
        </p>
        <p className='mx-auto mt-3 line-clamp-3 max-w-xl text-fg/85'>
          {current.overview}
        </p>
        <div className='mt-5 flex flex-wrap justify-center gap-3'>
          <TrailerButton
            movieId={current.id}
            title={current.title}
            className={`${heroButtons} bg-brand text-on-brand hover:bg-brand-hover`}
          />
          <Link
            to={`/movie/${current.id}`}
            className={`${heroButtons} border border-border bg-surface-2/70 hover:bg-surface-2`}
          >
            <Info className='size-5' aria-hidden />
            Details
          </Link>
        </div>
      </div>
    </section>
  )
}

function RoundButton({
  label,
  children,
  onClick,
  atEnd,
}: {
  label: string
  children: React.ReactNode
  onClick: () => void
  atEnd: boolean
}) {
  // aria-disabled (not disabled) so keyboard focus isn't dropped at the ends.
  return (
    <button
      type='button'
      aria-label={label}
      aria-disabled={atEnd}
      onClick={() => !atEnd && onClick()}
      className='pointer-events-auto grid size-12 place-items-center rounded-full border border-border bg-bg/70 backdrop-blur transition hover:bg-surface-2 aria-disabled:opacity-30'
    >
      {children}
    </button>
  )
}
