import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Info, Star } from 'lucide-react'
import { BlurBackdrop } from './BlurBackdrop'
import { TrailerButton } from '@/components/movie/TrailerButton'
import { WatchlistButton } from '@/components/movie/WatchlistButton'
import { heroButtons } from '@/components/movie/buttonStyles'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useAmbientFromImage } from '@/hooks/useAmbientFromImage'
import { prefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { releaseYear } from '@/lib/format'
import { homeIndex, middleCopy, reelCopies, wrap } from '@/lib/loop'
import { uniqueById } from '@/lib/search'
import type { Feed } from '@/lib/feeds'
import { imageUrl } from '@/services/tmdb'
import { Alert } from '@/components/ui/Alert'

export function Spotlight({ feed }: { feed: Feed }) {
  const navigate = useNavigate()
  const { data, isPending, error } = useQuery({
    queryKey: feed.key,
    queryFn: ({ signal }) => feed.fetch(signal),
  })
  const movies = useMemo(
    () =>
      uniqueById(data?.results.filter(m => m.poster_path) ?? []).slice(0, 10),
    [data],
  )
  const n = movies.length
  const copies = reelCopies(n)
  const home = middleCopy(copies)
  // Every movie appears once per copy; `f` is its position in the whole strip.
  const strip = useMemo(
    () =>
      Array.from({ length: copies * n }, (_, f) => ({
        f,
        i: f % n,
        copy: Math.floor(f / n),
        movie: movies[f % n],
      })),
    [movies, copies, n],
  )

  const [active, setActive] = useState(0)
  // Where we're heading, so rapid key presses don't reuse a stale position
  // while a smooth scroll is still settling.
  const targetFlat = useRef(0)
  const navigating = useRef(false)
  const navTimer = useRef<number>(undefined)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const reelRef = useRef<HTMLUListElement>(null)
  const current = movies[active]
  const year = current ? releaseYear(current.release_date) : null

  useAmbientFromImage(imageUrl(current?.poster_path ?? null, 'w92'))
  // Landscape art when TMDB has it, otherwise the poster. It's only lightly
  // blurred now, so use a size that holds up when stretched across the hero.
  const rawBackdrop =
    imageUrl(current?.backdrop_path ?? null, 'w1280') ??
    imageUrl(current?.poster_path ?? null, 'w500')
  // Flinging the reel passes many posters; only fetch art for the one it lands on.
  const backdropSrc = useDebouncedValue(rawBackdrop, 150)
  const announced = useDebouncedValue(
    current ? `${current.title}, ${active + 1} of ${n}` : '',
    400,
  )

  const slide = (f: number) => itemRefs.current[f]?.parentElement ?? null

  /** Strip position of the slide nearest the reel's centre (layout-based, so
   *  the coverflow transforms don't affect it). */
  const centeredFlat = () => {
    const root = reelRef.current
    if (!root) return null
    const mid = root.scrollLeft + root.clientWidth / 2
    let best: number | null = null
    let bestDist = Infinity
    for (let f = 0; f < strip.length; f++) {
      const el = slide(f)
      if (!el) continue
      const dist = Math.abs(
        el.offsetLeft - root.offsetLeft + el.offsetWidth / 2 - mid,
      )
      if (dist < bestDist) {
        best = f
        bestDist = dist
      }
    }
    return best
  }

  const jumpTo = (f: number) => {
    const root = reelRef.current
    const el = slide(f)
    if (!root || !el) return
    // Snapping is paused so the jump can't be "corrected" halfway.
    root.style.scrollSnapType = 'none'
    root.scrollLeft =
      el.offsetLeft - root.offsetLeft - (root.clientWidth - el.offsetWidth) / 2
    requestAnimationFrame(() => (root.style.scrollSnapType = ''))
  }

  // Start on the first film in the *middle* copy: neighbours show on both sides.
  useLayoutEffect(() => {
    if (n === 0) return
    targetFlat.current = home * n
    jumpTo(home * n)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  /** If the reel is resting in an outer copy, jump to the identical slide in
   *  the middle copy (unnoticeable) and keep the pending target in step. */
  const recenter = () => {
    const f = centeredFlat()
    if (f === null || Math.floor(f / n) === home) return false
    const to = homeIndex(f, n, copies)
    jumpTo(to)
    targetFlat.current += to - f
    return true
  }

  // Makes the reel endless: re-centre once scrolling has fully settled, and
  // never while a finger or mouse still holds the reel (it would yank the
  // content out from under the gesture).
  useEffect(() => {
    const root = reelRef.current
    if (!root || copies === 1) return
    let timer: number | undefined
    let held = 0
    const settle = () => {
      if (held === 0) recenter()
    }
    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, 140)
    }
    const hold = () => void (held += 1)
    const release = () => {
      held = Math.max(0, held - 1)
      schedule()
    }
    root.addEventListener('scroll', schedule, { passive: true })
    root.addEventListener('scrollend', settle)
    root.addEventListener('pointerdown', hold)
    root.addEventListener('touchstart', hold, { passive: true })
    for (const t of ['pointerup', 'pointercancel', 'touchend', 'touchcancel']) {
      root.addEventListener(t, release)
    }
    return () => {
      window.clearTimeout(timer)
      root.removeEventListener('scroll', schedule)
      root.removeEventListener('scrollend', settle)
      root.removeEventListener('pointerdown', hold)
      root.removeEventListener('touchstart', hold)
      for (const t of [
        'pointerup',
        'pointercancel',
        'touchend',
        'touchcancel',
      ]) {
        root.removeEventListener(t, release)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strip, copies])

  // Whichever poster crosses the centre line of the reel becomes active.
  useEffect(() => {
    const root = reelRef.current
    if (!root || n === 0) return
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.index)
            if (!navigating.current) {
              targetFlat.current = Number(
                (e.target as HTMLElement).dataset.flat,
              )
            }
            setActive(i)
          }
        }
      },
      { root, rootMargin: '0px -49% 0px -49%' },
    )
    strip.forEach(({ f }) => slide(f) && io.observe(slide(f)!))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strip])

  useEffect(() => () => window.clearTimeout(navTimer.current), [])

  const center = (f: number) => {
    slide(f)?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }
  const goToFlat = (requested: number) => {
    let f = requested
    // Holding a key can run the target off the end of the strip while the
    // scroll is still catching up. Slide the view and the target by one whole
    // copy (identical content, so invisible) until the target is in range.
    for (let guard = 0; guard < 3 && (f < 0 || f >= strip.length); guard++) {
      const dir = f < 0 ? 1 : -1
      const at = centeredFlat() ?? home * n
      const moved = Math.min(strip.length - 1, Math.max(0, at + dir * n))
      jumpTo(moved)
      const shift = moved - at
      targetFlat.current += shift
      f += shift
    }
    const next = Math.min(strip.length - 1, Math.max(0, f))
    targetFlat.current = next
    navigating.current = true
    window.clearTimeout(navTimer.current)
    navTimer.current = window.setTimeout(
      () => (navigating.current = false),
      900,
    )
    center(next)
    // Focus lives on the middle copy (the only one assistive tech sees).
    itemRefs.current[home * n + wrap(next, n)]?.focus({ preventScroll: true })
  }
  const go = (delta: number) => {
    const base = navigating.current
      ? targetFlat.current
      : (centeredFlat() ?? home * n)
    goToFlat(base + delta)
  }
  const onKeyDown = (e: KeyboardEvent) => {
    const base = navigating.current
      ? targetFlat.current
      : (centeredFlat() ?? home * n)
    const copyStart = Math.floor(base / n) * n
    if (e.key === 'ArrowRight') goToFlat(base + 1)
    else if (e.key === 'ArrowLeft') goToFlat(base - 1)
    else if (e.key === 'Home') goToFlat(copyStart)
    else if (e.key === 'End') goToFlat(copyStart + n - 1)
    else return
    e.preventDefault()
  }

  if (error) {
    return (
      <div className='mx-auto max-w-xl px-4 py-10'>
        <Alert variant='error' title='Couldn’t load what’s playing'>
          {error.message}
        </Alert>
      </div>
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
      className='relative isolate'
    >
      <BlurBackdrop src={backdropSrc} />
      <h1 className='sr-only'>StreamzGPT — now playing</h1>
      <div className='relative'>
        <ul
          ref={reelRef}
          style={{ perspective: '900px' }}
          onKeyDown={onKeyDown}
          className='scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto pb-14 pt-8'
        >
          {strip.map(({ f, i, copy, movie: m }) => {
            const isHome = copy === home
            return (
              <li
                key={`${copy}-${m.id}`}
                data-index={i}
                data-flat={f}
                data-active={i === active}
                className='reel-item group/card relative w-48 shrink-0 snap-center sm:w-64'
                aria-roledescription='slide'
                aria-label={`${i + 1} of ${n}`}
                // The extra copies exist only for the endless scroll; screen
                // readers get one clean list of slides.
                aria-hidden={isHome ? undefined : true}
              >
                <button
                  ref={el => void (itemRefs.current[f] = el)}
                  type='button'
                  tabIndex={isHome && i === active ? 0 : -1}
                  aria-current={isHome && i === active ? true : undefined}
                  onClick={() =>
                    i === active ? navigate(`/movie/${m.id}`) : goToFlat(f)
                  }
                  className='block aspect-2/3 w-full overflow-hidden rounded-3xl bg-surface-2 shadow-2xl shadow-black/60 ring-1 ring-white/10 transition-shadow duration-200 group-data-[active=true]/card:group-hover/card:ring-2 group-data-[active=true]/card:group-hover/card:ring-brand'
                >
                  <img
                    src={imageUrl(m.poster_path, 'w500') ?? ''}
                    alt={isHome ? m.title : ''}
                    className='size-full object-cover'
                    draggable={false}
                    loading={isHome && i < 3 ? 'eager' : 'lazy'}
                    fetchPriority={isHome && i < 3 ? 'high' : 'auto'}
                  />
                </button>
                {i === active && (
                  // Revealed on hover/focus of the centred card (always visible on
                  // touch screens, which have no hover). A sibling of the poster
                  // button, since links can't nest inside buttons.
                  <Link
                    to={`/movie/${m.id}`}
                    tabIndex={isHome ? 0 : -1}
                    className='absolute inset-x-0 bottom-4 mx-auto flex w-fit translate-y-2 items-center gap-2 rounded-full bg-bg/85 px-4 py-2.5 text-sm font-semibold opacity-0 shadow-lg backdrop-blur transition duration-200 ease-out group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100 hover:bg-brand hover:text-on-brand [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100'
                  >
                    <Info className='size-4' aria-hidden />
                    Details
                    <span className='sr-only'>about {m.title}</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
        <div className='pointer-events-none absolute inset-y-0 left-2 right-2 hidden items-center justify-between sm:flex'>
          <RoundButton label='Previous movie' onClick={() => go(-1)}>
            <ChevronLeft className='size-6' aria-hidden />
          </RoundButton>
          <RoundButton label='Next movie' onClick={() => go(1)}>
            <ChevronRight className='size-6' aria-hidden />
          </RoundButton>
        </div>
      </div>

      {/* Debounced so flinging past several posters announces only where it lands. */}
      <p className='sr-only' aria-live='polite'>
        {announced}
      </p>
      <div
        key={current.id}
        className='rise-in mx-auto max-w-2xl px-4 text-center'
      >
        {/* The rating sits beside the heading (not inside it) so the heading's
            accessible name stays just "Title (Year)". */}
        <div className='text-3xl font-extrabold sm:text-5xl'>
          <h2 className='inline'>
            {current.title}
            {year && (
              <span className='ml-2 font-normal text-muted'>({year})</span>
            )}
          </h2>
          <span className='ml-1.5 inline-flex items-center gap-1 align-super text-base font-semibold leading-none text-fg sm:text-lg'>
            <Star className='size-4 fill-brand text-brand' aria-hidden />
            <span className='sr-only'>Rated</span>
            {current.vote_average.toFixed(1)}
          </span>
        </div>
        <div className='mt-5 flex flex-wrap items-center justify-center gap-3'>
          <TrailerButton
            movieId={current.id}
            title={current.title}
            className={`${heroButtons} bg-brand text-on-brand hover:bg-brand-hover`}
          />
          <WatchlistButton
            movie={current}
            className='size-12 border border-border bg-surface-2/70 hover:bg-surface-2'
          />
        </div>
      </div>
    </section>
  )
}

function RoundButton({
  label,
  children,
  onClick,
}: {
  label: string
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type='button'
      aria-label={label}
      onClick={onClick}
      className='pointer-events-auto grid size-12 place-items-center rounded-full border border-border bg-bg/70 backdrop-blur transition hover:bg-surface-2'
    >
      {children}
    </button>
  )
}
