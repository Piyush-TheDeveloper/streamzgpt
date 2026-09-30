import { useEffect } from 'react'
import { useRouteError } from 'react-router'

export function RouteError() {
  const error = useRouteError()
  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  return (
    <main className='grid min-h-dvh place-items-center px-4 text-center'>
      <div className='space-y-4'>
        <h1 className='text-3xl font-bold'>Something went wrong</h1>
        <p className='text-muted'>
          If the app was just updated, reloading usually fixes it.
        </p>
        <div className='flex justify-center gap-3'>
          <button
            type='button'
            onClick={() => window.location.reload()}
            className='rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-hover'
          >
            Reload
          </button>
          <a
            href='/'
            className='rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:border-fg'
          >
            Home
          </a>
        </div>
      </div>
    </main>
  )
}
