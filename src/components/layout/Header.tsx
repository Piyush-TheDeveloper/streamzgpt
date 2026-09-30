import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import { signOut } from '@/services/auth'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/search', label: 'Search' },
  { to: '/ai', label: 'AI Picks', icon: Sparkles },
]

export function Header() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [signOutFailed, setSignOutFailed] = useState(false)

  async function onSignOut() {
    try {
      await signOut()
    } catch {
      setSignOutFailed(true)
      return
    }
    setUser(null)
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <header className='sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur'>
      <div className='mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6'>
        <Link to='/' className='text-xl font-extrabold tracking-tight'>
          Streamz<span className='text-brand'>GPT</span>
        </Link>
        <nav className='flex items-center gap-1 text-sm'>
          {links.map(({ to, label, end, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-2 transition-colors hover:text-fg',
                  isActive ? 'text-fg' : 'text-muted',
                )
              }
            >
              {Icon && <Icon className='size-4 text-brand' aria-hidden />}
              {label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className='ml-auto flex items-center gap-3 text-sm'>
            <span className='hidden text-muted sm:inline'>
              {user.name || user.email}
            </span>
            {signOutFailed && (
              <span role='alert' className='text-xs text-brand'>
                Couldn’t sign out. Try again.
              </span>
            )}
            <button
              type='button'
              onClick={onSignOut}
              className='rounded-md border border-border px-3 py-1.5 transition hover:border-muted'
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
