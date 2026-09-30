import { useQuery } from '@tanstack/react-query'
import { getMoviesByCategory } from '@/services/tmdb'
import type { MovieCategory } from '@/types/movie'
import { MovieCard } from './MovieCard'

export function MovieRow({
  category,
  title,
}: {
  category: MovieCategory
  title: string
}) {
  const { data, isPending, error } = useQuery({
    queryKey: ['movies', category],
    queryFn: ({ signal }) => getMoviesByCategory(category, signal),
  })

  return (
    <section aria-label={title} className='space-y-3'>
      <h2 className='text-lg font-semibold sm:text-xl'>{title}</h2>
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
                  className='aspect-2/3 w-36 shrink-0 animate-pulse rounded-lg bg-surface-2 sm:w-44'
                />
              ))
            : data.results.map(m => <MovieCard key={m.id} movie={m} />)}
        </div>
      )}
    </section>
  )
}
