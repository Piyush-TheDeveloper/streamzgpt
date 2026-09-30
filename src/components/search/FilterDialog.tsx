import { useId, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { SORT_LABELS, type SortMode } from '@/lib/feeds'
import { GENRES } from '@/lib/genres'
import { LANGUAGES, REGIONS, WORLDWIDE } from '@/lib/regions'
import { cn } from '@/lib/utils'

export interface FilterValues {
  country: string
  language: string | null
  sort: SortMode
  genre: number | null
}

const SORTS = Object.keys(SORT_LABELS) as SortMode[]

export function FilterDialog({
  initial,
  defaults,
  searching,
  kids,
  onApply,
  onClose,
}: {
  initial: FilterValues
  /** What "Reset" returns to (the profile's own region, Trending, nothing else). */
  defaults: FilterValues
  /** A text search is active: only genre can narrow those results. */
  searching: boolean
  /** Kids search runs inside the kid-safe catalogue, which country can narrow. */
  kids: boolean
  onApply: (values: FilterValues) => void
  onClose: () => void
}) {
  // Edits stay local until "Apply"; Cancel, Esc and the backdrop discard them.
  const [draft, setDraft] = useState(initial)
  const set = <K extends keyof FilterValues>(key: K, value: FilterValues[K]) =>
    setDraft(d => ({ ...d, [key]: value }))
  // While searching, only genre (and country for kids) can narrow results.
  const countryLocked = searching && !kids
  const browseLocked = searching

  return (
    <Modal
      title='Filters'
      onClose={onClose}
      footer={close => (
        <>
          <button
            type='button'
            onClick={() =>
              // Reset only what's editable, so a search can't wipe the browse
              // filters the user set earlier.
              setDraft(d =>
                searching
                  ? {
                      ...d,
                      genre: null,
                      country: kids ? defaults.country : d.country,
                    }
                  : defaults,
              )
            }
            className='mr-auto rounded-full px-4 py-2.5 text-sm font-medium text-muted hover:text-fg'
          >
            Reset
          </button>
          <button
            type='button'
            onClick={close}
            className='rounded-full border border-border px-6 py-2.5 text-sm font-medium hover:border-fg'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={() => {
              onApply(draft)
              close()
            }}
            className='rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-hover'
          >
            Apply filters
          </button>
        </>
      )}
    >
      <div className='space-y-6'>
        {searching && (
          <Alert variant='info' title='You’re searching'>
            {kids
              ? 'Language and sort apply when browsing. Clear the search box to use them.'
              : 'Country, language and sort apply when browsing. Clear the search box to use them.'}{' '}
            Genre still narrows search results.
          </Alert>
        )}

        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='Country' disabled={countryLocked}>
            {props => (
              <select
                {...props}
                value={draft.country}
                onChange={e => set('country', e.target.value)}
              >
                <option value={WORLDWIDE}>Worldwide</option>
                {REGIONS.map(r => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label='Language' disabled={browseLocked}>
            {props => (
              <select
                {...props}
                value={draft.language ?? ''}
                onChange={e => set('language', e.target.value || null)}
              >
                <option value=''>All languages</option>
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            label='Sort by'
            disabled={browseLocked}
            className='sm:col-span-2'
          >
            {props => (
              <select
                {...props}
                value={draft.sort}
                onChange={e => set('sort', e.target.value as SortMode)}
              >
                {SORTS.map(m => (
                  <option key={m} value={m}>
                    {SORT_LABELS[m]}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <fieldset>
          <legend className='mb-3 text-sm text-muted'>Genre</legend>
          <div className='flex flex-wrap gap-2'>
            <GenreChoice
              checked={draft.genre === null}
              onChange={() => set('genre', null)}
            >
              All genres
            </GenreChoice>
            {GENRES.map(g => (
              <GenreChoice
                key={g.id}
                checked={draft.genre === g.id}
                onChange={() => set('genre', g.id)}
              >
                {g.name}
              </GenreChoice>
            ))}
          </div>
        </fieldset>
      </div>
    </Modal>
  )
}

function Field({
  label,
  disabled,
  className,
  children,
}: {
  label: string
  disabled?: boolean
  className?: string
  children: (props: {
    id: string
    disabled?: boolean
    className: string
  }) => React.ReactNode
}) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className='mb-2 block text-sm text-muted'>
        {label}
      </label>
      {children({
        id,
        disabled,
        className:
          'h-12 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-brand disabled:opacity-50',
      })}
    </div>
  )
}

/** Single-choice genre pill built on a real radio input (arrow keys work). */
function GenreChoice({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: () => void
  children: React.ReactNode
}) {
  return (
    <label className='cursor-pointer'>
      <input
        type='radio'
        name='genre'
        checked={checked}
        onChange={onChange}
        className='peer sr-only'
      />
      <span
        className={cn(
          'block rounded-full border border-border px-4 py-2.5 text-sm transition-colors',
          'peer-checked:border-brand peer-checked:bg-brand peer-checked:font-semibold peer-checked:text-on-brand',
          'peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand',
        )}
      >
        {children}
      </span>
    </label>
  )
}
