import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <ComingSoonPage title='Search' /> },
      { path: 'ai', element: <ComingSoonPage title='AI Picks' /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
