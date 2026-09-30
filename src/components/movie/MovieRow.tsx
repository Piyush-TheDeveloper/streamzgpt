import { useQuery } from '@tanstack/react-query'
import type { Feed } from '@/lib/feeds'
import { MovieCard } from './MovieCard'

export function MovieRow({ feed, title }: { feed: Feed; title: string }) {
  const { data, isPending, error } = useQuery({
    queryKey: feed.key,
    queryFn: ({ signal }) => feed.fetch(signal),
  })

  // A filtered row (e.g. a kids profile's favourite genres) may have no titles.
  if (data && data.results.length === 0) return null

  return (
    <section aria-label={title} className='space-y-3'>
      <h2 className='text-2xl font-extrabold'>{title}</h2>
      {error ? (
        <p role='alert' className='text-sm text-muted'>
          {error.message}
        </p>
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
