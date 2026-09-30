import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { MovieCard } from '@/components/movie/MovieCard'
import { useProfile } from '@/features/profiles/ProfileContext'
import { useWatchlist } from '@/features/watchlist/useWatchlist'
import { GENRES } from '@/lib/genres'
import { MOODS } from '@/lib/moods'
import { aiErrorMessage, getAiPicks } from '@/services/ai'

const KIDS_MOODS = new Set(['cozy', 'epic'])
const EXAMPLES = [
  'Like Inception, but funnier',
  'A feel-good movie for a rainy Sunday',
  'Underrated sci-fi from the 90s',
]

export function AiPage() {
  const { active } = useProfile()
  const { movies: saved } = useWatchlist()
  const [prompt, setPrompt] = useState('')
  const [moodId, setMoodId] = useState<string | null>(null)
  const kids = active?.kids ?? false
  const moods = kids ? MOODS.filter(m => KIDS_MOODS.has(m.id)) : MOODS

  const picks = useMutation({
    mutationFn: (input: { prompt: string; mood?: string }) =>
      getAiPicks({
        ...input,
        profileId: active!.id,
        genres: GENRES.filter(g => active?.genres.includes(g.id)).map(
          g => g.name,
        ),
        saved: saved.slice(0, 10).map(m => m.title),
      }),
  })

  // A mood hidden by switching to a kids profile must not be sent silently.
  const activeMoodId = moods.some(m => m.id === moodId) ? moodId : null
  const ask = (text = prompt, mood: string | null = activeMoodId) => {
    const moodLabel = moods.find(m => m.id === mood)?.label
    picks.mutate({ prompt: text.trim(), mood: moodLabel })
  }
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!picks.isPending) ask()
  }

  const results = picks.data

  return (
    <div className='mx-auto max-w-5xl px-4 pb-16 pt-28 sm:px-6'>
      <div className='text-center'>
        <p className='mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-1.5 text-sm text-muted'>
          <Sparkles className='size-4 text-brand' aria-hidden />
          Powered by AI
        </p>
        <h1 className='text-4xl font-extrabold sm:text-6xl'>
          What do you feel like watching?
        </h1>
        <p className='mx-auto mt-3 max-w-xl text-muted'>
          Describe a vibe, a film you loved, anything. Suggestions use{' '}
          {active ? `${active.name}’s` : 'your'} favourite genres and My List.
        </p>
      </div>

      <form onSubmit={onSubmit} className='mx-auto mt-8 max-w-2xl'>
        <label htmlFor='ai-prompt' className='sr-only'>
          Describe what you want to watch
        </label>
        <div className='flex gap-2 rounded-3xl border border-border bg-surface/80 p-2 backdrop-blur focus-within:border-brand'>
          <textarea
            id='ai-prompt'
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault()
                if (!picks.isPending) ask()
              }
            }}
            maxLength={300}
            rows={2}
            placeholder={EXAMPLES[0] + '…'}
            className='min-h-14 flex-1 resize-none bg-transparent px-4 py-3 text-lg outline-none placeholder:text-muted'
          />
          <button
            type='submit'
            disabled={picks.isPending}
            className='self-end rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-60'
          >
            {picks.isPending ? 'Thinking…' : 'Suggest'}
          </button>
        </div>
        <p className='mt-2 text-right text-xs text-muted' aria-hidden>
          {prompt.length}/300
        </p>
      </form>

      <div
        className='mt-4 flex flex-wrap justify-center gap-2'
        role='group'
        aria-label='Suggestions'
      >
        {moods.map(m => (
          <button
            key={m.id}
            type='button'
            aria-pressed={activeMoodId === m.id}
            onClick={() => {
              if (activeMoodId === m.id) return setMoodId(null)
              setMoodId(m.id)
              if (!picks.isPending) ask(prompt, m.id)
            }}
            className={
              'rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ' +
              (activeMoodId === m.id
                ? 'border-brand bg-brand text-on-brand'
                : 'border-border bg-surface/60 hover:border-muted')
            }
          >
            {m.label}
          </button>
        ))}
        {EXAMPLES.slice(1).map(ex => (
          <button
            key={ex}
            type='button'
            disabled={picks.isPending}
            onClick={() => {
              setPrompt(ex)
              setMoodId(null)
              ask(ex, null)
            }}
            className='rounded-full border border-dashed border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-muted hover:text-fg'
          >
            {ex}
          </button>
        ))}
        <button
          type='button'
          disabled={picks.isPending}
          onClick={() => {
            setPrompt('')
            setMoodId(null)
            ask('', null)
          }}
          className='rounded-full border border-dashed border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-muted hover:text-fg'
        >
          Surprise me
        </button>
      </div>

      <section
        aria-label='Suggestions'
        className='mt-12'
        aria-busy={picks.isPending}
      >
        <p className='sr-only' role='status' aria-live='polite'>
          {picks.isPending
            ? 'Finding suggestions'
            : results
              ? `${results.length} suggestions`
              : ''}
        </p>

        {picks.isPending ? (
          <ul
            aria-hidden
            className='grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4'
          >
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i} className='space-y-3'>
                <div className='aspect-2/3 animate-pulse rounded-2xl bg-surface-2' />
                <div className='h-3 w-3/4 animate-pulse rounded bg-surface-2' />
                <div className='h-3 w-1/2 animate-pulse rounded bg-surface-2' />
              </li>
            ))}
          </ul>
        ) : picks.isError ? (
          <div
            role='alert'
            className='rounded-3xl border border-border bg-surface/60 px-6 py-10 text-center'
          >
            <p className='text-muted'>{aiErrorMessage(picks.error)}</p>
            <button
              type='button'
              onClick={() => picks.reset()}
              className='mt-4 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:border-fg'
            >
              Dismiss
            </button>
          </div>
        ) : results && results.length === 0 ? (
          <p className='py-10 text-center text-muted'>
            No matches this time. Try rewording it, or tap “Surprise me”.
          </p>
        ) : results ? (
          <ul className='grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4'>
            {results.map(({ movie, reason }) => (
              <li key={movie.id} className='rise-in'>
                <MovieCard movie={movie} className='w-full' />
                {reason && (
                  <p className='mt-2 text-sm leading-snug text-fg/80'>
                    <span className='sr-only'>Why: </span>
                    {reason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  )
}
