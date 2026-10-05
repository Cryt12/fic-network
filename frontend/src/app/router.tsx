import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/app/AppShell'
import { ComingSoonPage } from '@/app/ComingSoonPage'
import { AdminRoute, GuestRoute, ProtectedRoute } from '@/app/guards'
import { NotFoundPage } from '@/app/NotFoundPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'entries', element: <ComingSoonPage title="My Entries" phase={3} /> },
          { path: 'entries/new', element: <ComingSoonPage title="Add New Entry" phase={3} /> },
          { path: 'profile', element: <ComingSoonPage title="My Profile" phase={5} /> },
          {
            path: 'admin',
            element: <AdminRoute />,
            children: [{ index: true, element: <ComingSoonPage title="Admin Panel" phase={6} /> }],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
