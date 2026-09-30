import { useMemo } from 'react'
import { LanguageLinks } from '@/components/home/LanguageLinks'
import { MoodPicker } from '@/components/home/MoodPicker'
import { Spotlight } from '@/components/home/Spotlight'
import { MovieRow } from '@/components/movie/MovieRow'
import { MovieCard } from '@/components/movie/MovieCard'
import { useWatchlist } from '@/features/watchlist/useWatchlist'
import { useProfile } from '@/features/profiles/ProfileContext'
import { homeFeeds } from '@/lib/feeds'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function HomePage() {
  useDocumentTitle('Home')
  const { active } = useProfile()
  const { movies: saved } = useWatchlist()
  const feeds = useMemo(() => homeFeeds(active!), [active])

  return (
    <div className='pt-24'>
      <Spotlight key={active!.id} feed={feeds.spotlight} />
      <div className='mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6'>
        <MoodPicker key={active!.id} kids={active!.kids} />
        {!active!.kids && <LanguageLinks region={active!.region} />}
        {saved.length > 0 && (
          <section aria-label='My List' className='space-y-3'>
            <h2 className='text-2xl font-extrabold'>My List</h2>
            <div className='scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 py-4 sm:-mx-6 sm:px-6'>
              {saved.slice(0, 20).map(m => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>
          </section>
        )}
        {feeds.rows.map((r, i) => (
          <MovieRow key={r.title} title={r.title} feed={r.feed} lazy={i > 1} />
        ))}
      </div>
    </div>
  )
}
