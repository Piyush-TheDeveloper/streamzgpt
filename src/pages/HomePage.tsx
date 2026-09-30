import { Hero } from '@/components/movie/Hero'
import { MovieRow } from '@/components/movie/MovieRow'

export function HomePage() {
  return (
    <>
      <Hero />
      <div className='mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6'>
        <MovieRow category='now_playing' title='Now Playing' />
        <MovieRow category='popular' title='Popular' />
        <MovieRow category='top_rated' title='Top Rated' />
        <MovieRow category='upcoming' title='Upcoming' />
      </div>
    </>
  )
}
