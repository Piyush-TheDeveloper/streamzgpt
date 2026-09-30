import { Link, NavLink } from 'react-router'
import { Home, Search, Sparkles, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileMenu } from './ProfileMenu'

const links: { to: string; label: string; end?: boolean; icon: LucideIcon }[] =
  [
    { to: '/', label: 'Home', end: true, icon: Home },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/ai', label: 'AI Picks', icon: Sparkles },
  ]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors',
    isActive ? 'bg-fg text-bg' : 'text-muted hover:bg-surface-2 hover:text-fg',
  )

export function Header() {
  return (
    <>
      <header className='pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3'>
        <div className='pointer-events-auto flex items-center gap-2 rounded-full border border-border/70 bg-bg/70 py-1.5 pl-5 pr-1.5 shadow-lg shadow-black/30 backdrop-blur-xl'>
          <Link
            to='/'
            className='mr-2 font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight'
          >
            streamz<span className='text-brand'>gpt</span>
          </Link>
          <nav aria-label='Main' className='hidden items-center gap-1 sm:flex'>
            {links.map(({ to, label, end, icon: Icon }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                <Icon className='size-4' aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
          <ProfileMenu />
        </div>
      </header>

      <nav
        aria-label='Main'
        className='fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-full border border-border/70 bg-bg/80 p-1.5 shadow-lg shadow-black/40 backdrop-blur-xl sm:hidden'
      >
        {links.map(({ to, label, end, icon: Icon }) => (
          <NavLink key={to} to={to} end={end} className={linkClass}>
            <Icon className='size-5' aria-hidden />
            <span className='sr-only'>{label}</span>
            <span aria-hidden className='hidden min-[380px]:inline'>
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
