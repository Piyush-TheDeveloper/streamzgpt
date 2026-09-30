import { MovieCard } from './MovieCard'
import type { Movie } from '@/types/movie'

export function MovieGrid({ movies }: { movies: Movie[] }) {
  return (
    <ul className='grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]'>
      {movies.map(m => (
        <li key={m.id}>
          <MovieCard movie={m} className='w-full' />
        </li>
      ))}
    </ul>
  )
}
