import { Bookmark, BookmarkCheck } from 'lucide-react'
import {
  useIsSaved,
  useToggleWatchlist,
} from '@/features/watchlist/useWatchlist'
import { cn } from '@/lib/utils'
import type { Movie } from '@/types/movie'

/** Toggle for "My List". `icon` is the compact overlay used on cards. */
export function WatchlistButton({
  movie,
  variant = 'icon',
  className,
}: {
  movie: Movie
  variant?: 'icon' | 'full'
  className?: string
}) {
  const saved = useIsSaved(movie.id)
  const toggle = useToggleWatchlist()
  const label = saved
    ? `Remove ${movie.title} from My List`
    : `Add ${movie.title} to My List`
  const Icon = saved ? BookmarkCheck : Bookmark

  if (variant === 'full') {
    return (
      <button
        type='button'
        aria-pressed={saved}
        onClick={() => toggle(movie, saved)}
        className={cn(
          'inline-flex items-center gap-2 rounded-md border border-border bg-surface-2/70 px-5 py-2.5 text-sm font-semibold transition hover:bg-surface-2',
          saved && 'border-brand text-brand',
          className,
        )}
      >
        <Icon className='size-5' aria-hidden />
        {saved ? 'In My List' : 'Add to My List'}
      </button>
    )
  }
  return (
    <button
      type='button'
      aria-pressed={saved}
      aria-label={label}
      title={label}
      onClick={() => toggle(movie, saved)}
      className={cn(
        'grid size-11 place-items-center rounded-full bg-bg/80 backdrop-blur transition hover:bg-bg',
        saved ? 'text-brand' : 'text-fg',
        className,
      )}
    >
      <Icon className='size-5' aria-hidden />
    </button>
  )
}
