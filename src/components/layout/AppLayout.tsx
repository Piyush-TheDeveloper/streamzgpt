import { Outlet } from 'react-router'
import { Header } from './Header'

export function AppLayout() {
  return (
    <div className='flex min-h-dvh flex-col'>
      <Header />
      <main className='flex-1'>
        <Outlet />
      </main>
      <footer className='border-t border-border/60 py-6 text-center text-xs text-muted'>
        Movie data by TMDB. This product uses the TMDB API but is not endorsed
        or certified by TMDB.
      </footer>
    </div>
  )
}
