import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  FullScreenSpinner,
  GuestOnly,
  RequireAuth,
} from '@/components/auth/RouteGuards'
import { HomePage } from '@/pages/HomePage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      {
        path: 'login',
        HydrateFallback: FullScreenSpinner,
        lazy: async () => ({
          Component: (await import('@/pages/LoginPage')).LoginPage,
        }),
      },
      {
        path: 'signup',
        HydrateFallback: FullScreenSpinner,
        lazy: async () => ({
          Component: (await import('@/pages/SignupPage')).SignupPage,
        }),
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <HomePage /> },
          {
            path: 'movie/:id',
            HydrateFallback: FullScreenSpinner,
            lazy: async () => ({
              Component: (await import('@/pages/MovieDetailPage'))
                .MovieDetailPage,
            }),
          },
          { path: 'search', element: <ComingSoonPage title='Search' /> },
          { path: 'ai', element: <ComingSoonPage title='AI Picks' /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
