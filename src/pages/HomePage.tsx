import { MoodPicker } from '@/components/home/MoodPicker'
import { Spotlight } from '@/components/home/Spotlight'
import { MovieRow } from '@/components/movie/MovieRow'

export function HomePage() {
  return (
    <div className='pt-24'>
      <Spotlight />
      <div className='mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6'>
        <MoodPicker />
        <MovieRow category='popular' title='Popular right now' />
        <MovieRow category='top_rated' title='All-time greats' />
        <MovieRow category='upcoming' title='Coming soon' />
      </div>
    </div>
  )
}
