import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { Field } from '@/components/auth/Field'
import { Avatar } from '@/components/profile/Avatar'
import {
  useCreateProfile,
  useDeleteProfile,
  useUpdateProfile,
} from '@/features/profiles/mutations'
import { useProfile } from '@/features/profiles/ProfileContext'
import { AVATARS } from '@/lib/avatars'
import { GENRES } from '@/lib/genres'
import { detectRegion, REGIONS, WORLDWIDE } from '@/lib/regions'
import { cn } from '@/lib/utils'
import { validateProfileName } from '@/lib/validation'
import { MAX_PROFILES, type Profile } from '@/types/profile'

export function ProfileFormPage() {
  const { id } = useParams()
  const { profiles, active, status } = useProfile()
  const existing = id ? profiles.find(p => p.id === id) : undefined

  if (status === 'loading') return null
  if (active?.kids) return <Navigate to='/' replace />
  // Never treat a failed load as "no profiles": send them to the retry screen.
  if (status === 'error') return <Navigate to='/profiles' replace />
  if (id && !existing) return <Navigate to='/profiles' replace />
  return <ProfileForm key={existing?.id ?? 'new'} existing={existing} />
}

function ProfileForm({ existing }: { existing?: Profile }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profiles, active, setActive } = useProfile()
  const create = useCreateProfile()
  const update = useUpdateProfile(existing?.id ?? '')
  const remove = useDeleteProfile()

  const [name, setName] = useState(existing?.name ?? '')
  const [avatar, setAvatar] = useState(
    existing?.avatar ?? AVATARS[profiles.length % AVATARS.length].id,
  )
  const [kids, setKids] = useState(existing?.kids ?? false)
  const [autoplay, setAutoplay] = useState(existing?.autoplayTrailers ?? true)
  const [genres, setGenres] = useState<number[]>(existing?.genres ?? [])
  const [region, setRegion] = useState(
    existing?.region ?? detectRegion(navigator.language),
  )
  const [nameError, setNameError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const busy = create.isPending || update.isPending || remove.isPending
  const isFirst = profiles.length === 0
  // Decided once at mount: creating the 5th profile refetches the list, and the
  // limit must not then bounce the user away mid-submit.
  const [atLimit] = useState(() => !existing && profiles.length >= MAX_PROFILES)
  const canDelete = Boolean(existing) && profiles.length > 1

  if (atLimit) return <Navigate to='/profiles' replace />

  // Return to wherever the user came from (menu, home or manage screen).
  function goBack() {
    if (location.key !== 'default') navigate(-1)
    else navigate(active ? '/' : '/profiles', { replace: true })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const error = validateProfileName(name)
    setNameError(error)
    if (error) return
    setFormError(null)
    const input = {
      name: name.trim(),
      avatar,
      kids,
      autoplayTrailers: autoplay,
      genres,
      region,
    }
    try {
      if (existing) {
        await update.mutateAsync(input)
        goBack()
      } else {
        const created = await create.mutateAsync(input)
        setActive(created.id)
        navigate('/', { replace: true })
      }
    } catch {
      setFormError('Couldn’t save the profile. Please try again.')
    }
  }

  async function onDelete() {
    if (!existing) return
    try {
      await remove.mutateAsync(existing.id)
      if (existing.id === active?.id) setActive(null)
      navigate('/profiles', { replace: true })
    } catch {
      setFormError('Couldn’t delete the profile. Please try again.')
    }
  }

  const toggleGenre = (gid: number) =>
    setGenres(g => (g.includes(gid) ? g.filter(x => x !== gid) : [...g, gid]))

  return (
    <main className='mx-auto max-w-xl px-4 py-12'>
      <h1 className='text-3xl font-extrabold sm:text-4xl'>
        {existing
          ? 'Edit profile'
          : isFirst
            ? 'Create your profile'
            : 'Add profile'}
      </h1>
      <p className='mt-2 text-muted'>
        Each profile keeps its own taste and settings.
      </p>

      <form onSubmit={onSubmit} noValidate className='mt-8 space-y-8'>
        <div className='flex items-center gap-5'>
          <Avatar
            avatar={avatar}
            name={name}
            className='size-20 shrink-0 text-3xl'
          />
          <div className='flex-1'>
            <Field
              label='Name'
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={24}
              autoComplete='off'
              error={nameError}
            />
          </div>
        </div>

        <fieldset>
          <legend className='mb-3 text-sm text-muted'>Avatar colour</legend>
          <div className='flex flex-wrap gap-3'>
            {AVATARS.map(a => (
              <label key={a.id} className='cursor-pointer'>
                <input
                  type='radio'
                  name='avatar'
                  value={a.id}
                  checked={avatar === a.id}
                  onChange={() => setAvatar(a.id)}
                  className='peer sr-only'
                />
                <span
                  className='block size-11 rounded-full ring-offset-2 ring-offset-bg peer-checked:ring-2 peer-checked:ring-fg peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-brand'
                  style={{
                    background: `linear-gradient(135deg, ${a.from}, ${a.to})`,
                  }}
                >
                  <span className='sr-only'>{a.label}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor='region' className='mb-2 block text-sm text-muted'>
            Region
          </label>
          <select
            id='region'
            value={region}
            onChange={e => setRegion(e.target.value)}
            className='h-12 w-full rounded-md border border-border bg-bg px-3 text-sm outline-none focus:border-brand'
          >
            {REGIONS.map(r => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
            <option value={WORLDWIDE}>Worldwide</option>
          </select>
          <p className='mt-2 text-xs text-muted'>
            Sets what’s “Trending” on Home and the language rows (for India:
            Hindi, Tamil, Telugu, Malayalam, Kannada).
          </p>
        </div>

        <fieldset>
          <legend className='mb-3 text-sm text-muted'>Favourite genres</legend>
          <div className='flex flex-wrap gap-2'>
            {GENRES.map(g => (
              <label key={g.id} className='cursor-pointer'>
                <input
                  type='checkbox'
                  checked={genres.includes(g.id)}
                  onChange={() => toggleGenre(g.id)}
                  className='peer sr-only'
                />
                <span
                  className={cn(
                    'block rounded-full border border-border px-4 py-2.5 text-sm transition-colors',
                    'peer-checked:border-brand peer-checked:bg-brand peer-checked:font-semibold peer-checked:text-on-brand',
                    'peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand',
                  )}
                >
                  {g.name}
                </span>
              </label>
            ))}
          </div>
          <p className='mt-2 text-xs text-muted'>
            Used for the “Picked for {name.trim() || 'you'}” row on Home.
          </p>
        </fieldset>

        <div className='space-y-4'>
          <Switch
            label='Kids profile'
            hint='Family-friendly titles only (rated PG or below).'
            checked={kids}
            onChange={setKids}
          />
          <Switch
            label='Autoplay trailers'
            hint='Start trailers as soon as they open.'
            checked={autoplay}
            onChange={setAutoplay}
          />
        </div>

        {formError && (
          <p role='alert' className='text-sm text-danger'>
            {formError}
          </p>
        )}

        <div className='flex flex-wrap items-center gap-3'>
          <button
            type='submit'
            disabled={busy}
            className='rounded-full bg-brand px-6 py-3 text-sm font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-60'
          >
            {busy ? 'Saving…' : existing ? 'Save changes' : 'Create profile'}
          </button>
          {!isFirst && (
            <button
              type='button'
              onClick={goBack}
              className='rounded-full border border-border px-6 py-3 text-sm font-medium hover:border-fg'
            >
              Cancel
            </button>
          )}
          {canDelete &&
            (confirmDelete ? (
              <button
                type='button'
                onClick={onDelete}
                disabled={busy}
                className='ml-auto rounded-full bg-danger px-6 py-3 text-sm font-semibold text-on-brand'
              >
                Yes, delete this profile
              </button>
            ) : (
              <button
                type='button'
                onClick={() => setConfirmDelete(true)}
                className='ml-auto rounded-full border border-border px-6 py-3 text-sm font-medium text-danger hover:border-danger'
              >
                Delete profile
              </button>
            ))}
        </div>
      </form>
    </main>
  )
}

function Switch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className='flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-surface/60 p-4'>
      <span>
        <span className='block font-medium'>{label}</span>
        <span className='block text-sm text-muted'>{hint}</span>
      </span>
      <input
        type='checkbox'
        role='switch'
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className='peer sr-only'
      />
      <span
        aria-hidden
        className='relative h-7 w-12 shrink-0 rounded-full bg-surface-2 ring-1 ring-border transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-fg after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-5 peer-checked:after:bg-on-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand'
      />
    </label>
  )
}
