import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { genreParam, MOODS } from '@/lib/moods'
import { discoverMovies } from '@/services/tmdb'
import { MovieCard } from '@/components/movie/MovieCard'

export function MoodPicker() {
  const [moodId, setMoodId] = useState(MOODS[0].id)
  const mood = MOODS.find(m => m.id === moodId)!
  const { data, isPending, error } = useQuery({
    queryKey: ['mood', mood.id],
    queryFn: ({ signal }) => discoverMovies(genreParam(mood.genres), signal),
  })

  return (
    <section aria-labelledby='mood-heading' className='space-y-5'>
      <div>
        <h2 id='mood-heading' className='text-2xl font-extrabold sm:text-3xl'>
          What’s the mood tonight?
        </h2>
        <p className='text-muted'>{mood.blurb}</p>
      </div>
      <div
        role='group'
        aria-label='Pick a mood'
        className='flex flex-wrap gap-2'
      >
        {MOODS.map(m => (
          <button
            key={m.id}
            type='button'
            aria-pressed={m.id === moodId}
            onClick={() => setMoodId(m.id)}
            className={cn(
              'rounded-full border px-4 py-2.5 text-sm font-medium transition-colors',
              m.id === moodId
                ? 'border-brand bg-brand text-on-brand'
                : 'border-border bg-surface/60 text-fg hover:border-muted',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {error ? (
        <p role='alert' className='text-sm text-muted'>
          {error.message}
        </p>
      ) : (
        <div
          aria-busy={isPending}
          className='scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 py-4 sm:-mx-6 sm:px-6'
        >
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
