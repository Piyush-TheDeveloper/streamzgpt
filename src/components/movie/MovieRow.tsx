import { useQuery } from '@tanstack/react-query'
import { useInView } from '@/hooks/useInView'
import type { Feed } from '@/lib/feeds'
import { MovieCard } from './MovieCard'
import { Alert } from '@/components/ui/Alert'

export function MovieRow({
  feed,
  title,
  lazy = false,
}: {
  feed: Feed
  title: string
  /** Fetch only once the row is near the viewport (keeps Home's first load light). */
  lazy?: boolean
}) {
  const [ref, inView] = useInView<HTMLElement>('600px')
  const { data, isPending, error } = useQuery({
    enabled: !lazy || inView,
    queryKey: feed.key,
    queryFn: ({ signal }) => feed.fetch(signal),
  })

  // A filtered row (e.g. a kids profile's favourite genres) may have no titles.
  if (data && data.results.length === 0) return null

  return (
    <section ref={ref} aria-label={title} className='space-y-3'>
      <h2 className='text-2xl font-extrabold'>{title}</h2>
      {error ? (
        <Alert variant='error' title={`Couldn’t load “${title}”`}>
          {error.message}
        </Alert>
      ) : (
        <div className='scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 py-4 sm:-mx-6 sm:px-6'>
          {isPending
            ? Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className='aspect-2/3 w-36 shrink-0 animate-pulse rounded-2xl bg-surface-2 sm:w-44'
                />
              ))
            : data.results.map(m => <MovieCard key={m.id} movie={m} />)}
        </div>
      )}
    </section>
  )
}
