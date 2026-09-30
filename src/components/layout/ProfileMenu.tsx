import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, Settings, Users } from 'lucide-react'
import { Avatar } from '@/components/profile/Avatar'
import { useAuth } from '@/features/auth/AuthContext'
import { useProfile } from '@/features/profiles/ProfileContext'
import { signOut } from '@/services/auth'
import { cn } from '@/lib/utils'
import { Alert } from '@/components/ui/Alert'

const item =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-2'

export function ProfileMenu() {
  const { user, setUser } = useAuth()
  const { profiles, active, setActive } = useProfile()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [signOutFailed, setSignOutFailed] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  // Close on outside pointer / Escape (returning focus to the trigger).
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    // Move focus into the panel so keyboard users land on its first action.
    panelRef.current?.querySelector<HTMLElement>('button, a')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user || !active) return null

  async function onSignOut() {
    try {
      await signOut()
    } catch {
      setSignOutFailed(true)
      return
    }
    setOpen(false)
    setActive(null)
    setUser(null)
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div
      ref={rootRef}
      className='relative'
      onBlur={e => {
        // Tabbing out of the menu closes it. relatedTarget is null when a click
        // lands on an element Safari/Firefox won't focus: ignore that case
        // (outside clicks are handled by the pointerdown listener).
        const next = e.relatedTarget as Node | null
        if (!open) return
        if (next) {
          if (!e.currentTarget.contains(next)) setOpen(false)
        } else {
          // Focus left the page (e.g. Tab into browser chrome): close then.
          requestAnimationFrame(() => {
            if (!document.hasFocus()) setOpen(false)
          })
        }
      }}
    >
      <button
        ref={buttonRef}
        type='button'
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Account menu, ${active.name}`}
        onClick={() => {
          setSignOutFailed(false)
          setOpen(o => !o)
        }}
        className={cn(
          'grid size-11 place-items-center rounded-full ring-offset-2 ring-offset-bg transition',
          open ? 'ring-2 ring-fg' : 'hover:ring-2 hover:ring-fg/60',
        )}
      >
        <Avatar
          avatar={active.avatar}
          name={active.name}
          className='size-9 text-base'
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          className='absolute right-0 top-14 w-72 rounded-3xl border border-border bg-surface/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl'
        >
          {active.kids ? (
            <div className='flex items-center gap-3 px-3 py-2'>
              <Avatar
                avatar={active.avatar}
                name={active.name}
                className='size-8 text-sm'
              />
              <div>
                <p className='text-sm font-medium'>{active.name}</p>
                <p className='text-xs text-muted'>
                  Kids profile. Sign out to switch profiles.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className='px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-muted'>
                Switch profile
              </p>
              <ul>
                {profiles.map(p => (
                  <li key={p.id}>
                    <button
                      type='button'
                      aria-current={p.id === active.id}
                      onClick={() => {
                        setActive(p.id)
                        setOpen(false)
                      }}
                      className={item}
                    >
                      <Avatar
                        avatar={p.avatar}
                        name={p.name}
                        className='size-8 text-sm'
                      />
                      <span className='flex-1 truncate font-medium'>
                        {p.name}
                      </span>
                      {p.id === active.id && (
                        <span className='text-xs text-brand'>
                          <span className='sr-only'>Current profile, </span>
                          Active
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <div className='my-2 h-px bg-border' />
              <Link
                to={`/profiles/${active.id}/edit`}
                onClick={() => setOpen(false)}
                className={item}
              >
                <Settings className='size-4' aria-hidden />
                Preferences for {active.name}
              </Link>
              <Link
                to='/profiles'
                onClick={() => setOpen(false)}
                className={item}
              >
                <Users className='size-4' aria-hidden />
                Manage profiles
              </Link>
            </>
          )}
          <div className='my-2 h-px bg-border' />
          <p className='truncate px-3 pb-1 text-xs text-muted'>{user.email}</p>
          <button type='button' onClick={onSignOut} className={item}>
            <LogOut className='size-4' aria-hidden />
            Sign out
          </button>
          {signOutFailed && (
            <Alert variant='error' title='Couldn’t sign out' className='m-2'>
              Try again.
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}
