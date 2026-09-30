import { Link, NavLink } from 'react-router'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/search', label: 'Search' },
  { to: '/ai', label: 'AI Picks', icon: Sparkles },
]

export function Header() {
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
      </div>
    </header>
  )
}
