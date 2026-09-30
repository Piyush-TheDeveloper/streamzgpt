import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  FullScreenSpinner,
  GuestOnly,
  RequireAuth,
  RequireProfile,
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
    element: <RequireAuth />,
    children: [
      {
        path: 'profiles',
        HydrateFallback: FullScreenSpinner,
        lazy: async () => ({
          Component: (await import('@/pages/ProfilesPage')).ProfilesPage,
        }),
      },
      {
        path: 'profiles/new',
        HydrateFallback: FullScreenSpinner,
        lazy: async () => ({
          Component: (await import('@/pages/ProfileFormPage')).ProfileFormPage,
        }),
      },
      {
        path: 'profiles/:id/edit',
        HydrateFallback: FullScreenSpinner,
        lazy: async () => ({
          Component: (await import('@/pages/ProfileFormPage')).ProfileFormPage,
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
          {
            element: <RequireProfile />,
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
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
