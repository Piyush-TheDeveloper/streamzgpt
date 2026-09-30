import { useEffect, useRef } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { AmbientProvider } from '@/features/ambient/AmbientProvider'
import { Header } from './Header'

export function AppLayout() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const first = useRef(true)

  // WCAG 2.4.3: move focus to the new page's content on client-side navigation.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <AmbientProvider>
      <a
        href='#main'
        className='sr-only z-50 rounded-full bg-brand px-4 py-2 font-semibold text-on-brand focus:not-sr-only focus:fixed focus:left-3 focus:top-3'
      >
        Skip to content
      </a>
      <ScrollRestoration />
      <div className='flex min-h-dvh flex-col'>
        <Header />
        <main
          id='main'
          ref={mainRef}
          tabIndex={-1}
          className='flex-1 pb-24 pt-20 outline-none sm:pb-0'
        >
          <Outlet />
        </main>
        <footer className='border-t border-border/60 px-4 py-6 pb-28 text-center text-xs text-muted sm:pb-6'>
          Movie data by TMDB. This product uses the TMDB API but is not endorsed
          or certified by TMDB.
        </footer>
      </div>
    </AmbientProvider>
  )
}
