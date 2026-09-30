import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { Pencil, Plus } from 'lucide-react'
import { Avatar } from '@/components/profile/Avatar'
import { useProfile } from '@/features/profiles/ProfileContext'
import { MAX_PROFILES, type Profile } from '@/types/profile'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Alert } from '@/components/ui/Alert'

export function ProfilesPage() {
  useDocumentTitle('Who’s watching?')
  const { profiles, active, status, setActive, refetch } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const [managing, setManaging] = useState(false)

  const choose = (p: Profile) => {
    setActive(p.id)
    const from = location.state?.from
    navigate(from ? `${from.pathname}${from.search}${from.hash}` : '/', {
      replace: true,
    })
  }

  // Kids profiles can't leave or edit profiles; signing out is the way out.
  if (active?.kids) return <Navigate to='/' replace />

  const tile = 'group flex w-32 flex-col items-center gap-3 sm:w-40'
  const avatarClass =
    'size-28 text-5xl ring-offset-4 ring-offset-bg transition group-hover:ring-4 group-hover:ring-fg group-focus-visible:ring-4 group-focus-visible:ring-fg sm:size-36'

  return (
    <main className='grid min-h-dvh place-items-center px-4 py-12'>
      <div className='text-center'>
        <h1 className='text-4xl font-extrabold sm:text-5xl'>
          {managing ? 'Manage profiles' : 'Who’s watching?'}
        </h1>
        {status === 'error' ? (
          <Alert
            variant='error'
            title='Couldn’t load your profiles'
            className='mx-auto mt-8 max-w-sm'
            action={
              <button
                type='button'
                onClick={refetch}
                className='rounded-full bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover'
              >
                Try again
              </button>
            }
          />
        ) : (
          <ul className='mt-10 flex flex-wrap justify-center gap-6 sm:gap-10'>
            {profiles.map(p => (
              <li key={p.id}>
                {managing ? (
                  <Link to={`/profiles/${p.id}/edit`} className={tile}>
                    <span className='relative'>
                      <Avatar
                        avatar={p.avatar}
                        name={p.name}
                        className={avatarClass}
                      />
                      <span className='absolute inset-0 grid place-items-center rounded-full bg-black/55'>
                        <Pencil className='size-8' aria-hidden />
                      </span>
                    </span>
                    <span className='font-medium'>
                      <span className='sr-only'>Edit </span>
                      {p.name}
                    </span>
                  </Link>
                ) : (
                  <button
                    type='button'
                    onClick={() => choose(p)}
                    className={tile}
                  >
                    <Avatar
                      avatar={p.avatar}
                      name={p.name}
                      className={avatarClass}
                    />
                    <span className='font-medium'>{p.name}</span>
                    {p.kids && (
                      <span className='-mt-2 rounded-full border border-border px-2 py-0.5 text-xs text-muted'>
                        Kids
                      </span>
                    )}
                  </button>
                )}
              </li>
            ))}
            {profiles.length < MAX_PROFILES && (
              <li>
                <Link to='/profiles/new' className={tile}>
                  <span className='grid size-28 place-items-center rounded-full border-2 border-dashed border-border text-muted transition group-hover:border-fg group-hover:text-fg sm:size-36'>
                    <Plus className='size-10' aria-hidden />
                  </span>
                  <span className='font-medium text-muted group-hover:text-fg'>
                    Add profile
                  </span>
                </Link>
              </li>
            )}
          </ul>
        )}
        {profiles.length > 0 && (
          <button
            type='button'
            onClick={() => setManaging(m => !m)}
            className='mt-12 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted transition hover:border-fg hover:text-fg'
          >
            {managing ? 'Done' : 'Manage profiles'}
          </button>
        )}
      </div>
    </main>
  )
}
