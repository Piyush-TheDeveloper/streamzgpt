import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { genreParam, MOODS } from '@/lib/moods'
import { discoverMovies } from '@/services/tmdb'
import { MovieCard } from '@/components/movie/MovieCard'
import { Alert } from '@/components/ui/Alert'

const KIDS_MOODS = new Set(['cozy', 'epic'])

export function MoodPicker({ kids }: { kids: boolean }) {
  const moods = kids ? MOODS.filter(m => KIDS_MOODS.has(m.id)) : MOODS
  const [moodId, setMoodId] = useState(moods[0].id)
  const mood = moods.find(m => m.id === moodId) ?? moods[0]
  const { data, isPending, error } = useQuery({
    queryKey: ['mood', mood.id, kids],
    queryFn: ({ signal }) =>
      discoverMovies({ genres: genreParam(mood.genres), kids }, signal),
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
        {moods.map(m => (
          <button
            key={m.id}
            type='button'
            aria-pressed={m.id === mood.id}
            onClick={() => setMoodId(m.id)}
            className={cn(
              'rounded-full border px-4 py-2.5 text-sm font-medium transition-colors',
              m.id === mood.id
                ? 'border-brand bg-brand text-on-brand'
                : 'border-border bg-surface/60 text-fg hover:border-muted',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {error ? (
        <Alert variant='error' title='Couldn’t load these films'>
          {error.message}
        </Alert>
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
