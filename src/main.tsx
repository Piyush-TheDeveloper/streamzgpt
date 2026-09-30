import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router/dom'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ProfileProvider } from '@/features/profiles/ProfileProvider'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router'
import './index.css'

// After a deploy, an open tab may request chunks that no longer exist. Reload
// to pick up the new build, at most once a minute so a genuinely broken chunk
// surfaces the error page instead of looping.
window.addEventListener('vite:preloadError', event => {
  try {
    const last = Number(sessionStorage.getItem('streamz.reloadedAt') ?? 0)
    if (Date.now() - last < 60_000) return
    sessionStorage.setItem('streamz.reloadedAt', String(Date.now()))
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <RouterProvider router={router} />
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
