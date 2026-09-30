import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/AuthContext'

function FullScreenSpinner() {
  return (
    <div className='grid min-h-dvh place-items-center' role='status'>
      <div className='size-8 animate-spin rounded-full border-2 border-border border-t-brand' />
      <span className='sr-only'>Loading…</span>
    </div>
  )
}

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenSpinner />
  if (!user) return <Navigate to='/login' replace state={{ from: location }} />
  return <Outlet />
}

export function GuestOnly() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (user) return <Navigate to='/' replace />
  return <Outlet />
}
