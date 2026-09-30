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
// once to pick up the new build (the flag prevents a reload loop).
window.addEventListener('vite:preloadError', () => {
  try {
    if (sessionStorage.getItem('streamz.reloaded')) return
    sessionStorage.setItem('streamz.reloaded', '1')
  } catch {
    return
  }
  window.location.reload()
})

// A healthy load re-arms the reload guard for the next deploy.
window.setTimeout(() => {
  try {
    sessionStorage.removeItem('streamz.reloaded')
  } catch {
    /* ignore */
  }
}, 5000)

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
