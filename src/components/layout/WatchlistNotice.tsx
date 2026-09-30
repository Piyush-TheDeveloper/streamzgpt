import { useEffect, useState } from 'react'
import { useLastToggleError } from '@/features/watchlist/useWatchlist'

/** Tells the user when a save/remove failed and was rolled back. */
export function WatchlistNotice() {
  const errorAt = useLastToggleError()
  const [dismissedAt, setDismissedAt] = useState<number | null>(null)
  const visible = errorAt !== null && errorAt !== dismissedAt

  useEffect(() => {
    if (!visible) return
    const id = window.setTimeout(() => setDismissedAt(errorAt), 6000)
    return () => window.clearTimeout(id)
  }, [visible, errorAt])

  if (!visible) return null
  return (
    <div
      role='alert'
      className='fixed inset-x-3 bottom-24 z-50 mx-auto max-w-sm rounded-2xl border border-danger/50 bg-surface px-4 py-3 text-sm shadow-2xl sm:bottom-6'
    >
      Couldn’t update My List. Check your connection and try again.
    </div>
  )
}
