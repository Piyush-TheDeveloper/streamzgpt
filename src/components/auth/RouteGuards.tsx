import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/AuthContext'
import { useProfile } from '@/features/profiles/ProfileContext'

export function FullScreenSpinner() {
  return (
    <div className='grid min-h-dvh place-items-center' role='status'>
      <div className='size-8 animate-spin rounded-full border-2 border-border border-t-brand' />
      <span className='sr-only'>Loading…</span>
    </div>
  )
}

export function RequireAuth() {
  const { user, loading, error, retry } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenSpinner />
  if (error && !user) {
    return (
      <div className='grid min-h-dvh place-items-center px-4 text-center'>
        <div className='space-y-3'>
          <p role='alert'>Couldn’t reach the server.</p>
          <button
            type='button'
            onClick={retry}
            className='rounded-md bg-brand text-on-brand px-4 py-2 text-sm font-semibold hover:bg-brand-hover'
          >
            Try again
          </button>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to='/login' replace state={{ from: location }} />
  return <Outlet />
}

export function GuestOnly() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenSpinner />
  if (user) {
    const from = location.state?.from
    const to = from ? `${from.pathname}${from.search}${from.hash}` : '/'
    return <Navigate to={to} replace />
  }
  return <Outlet />
}

/** Signed-in users must have a profile selected before seeing the app. */
export function RequireProfile() {
  const { profiles, active, status, refetch } = useProfile()
  const location = useLocation()
  if (status === 'loading') return <FullScreenSpinner />
  if (status === 'error') {
    return (
      <div className='grid min-h-dvh place-items-center px-4 text-center'>
        <div className='space-y-3'>
          <p role='alert'>Couldn’t load your profiles.</p>
          <button
            type='button'
            onClick={refetch}
            className='rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-hover'
          >
            Try again
          </button>
        </div>
      </div>
    )
  }
  if (profiles.length === 0) return <Navigate to='/profiles/new' replace />
  if (!active) {
    return <Navigate to='/profiles' replace state={{ from: location }} />
  }
  return <Outlet />
}
