import { useMemo } from 'react'
import { MoodPicker } from '@/components/home/MoodPicker'
import { Spotlight } from '@/components/home/Spotlight'
import { MovieRow } from '@/components/movie/MovieRow'
import { useProfile } from '@/features/profiles/ProfileContext'
import { homeFeeds } from '@/lib/feeds'

export function HomePage() {
  const { active } = useProfile()
  const feeds = useMemo(() => homeFeeds(active!), [active])

  return (
    <div className='pt-24'>
      <Spotlight key={active!.id} feed={feeds.spotlight} />
      <div className='mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6'>
        <MoodPicker key={active!.id} kids={active!.kids} />
        {feeds.rows.map(r => (
          <MovieRow key={r.title} title={r.title} feed={r.feed} />
        ))}
      </div>
    </div>
  )
}
