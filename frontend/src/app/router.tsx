import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/app/AppShell'
import { ComingSoonPage } from '@/app/ComingSoonPage'
import { AdminRoute, GuestRoute, ProtectedRoute } from '@/app/guards'
import { NotFoundPage } from '@/app/NotFoundPage'
import { AdminEntriesPage } from '@/features/admin/AdminEntriesPage'
import { AdminLayout } from '@/features/admin/AdminLayout'
import { AdminUserDetailPage } from '@/features/admin/AdminUserDetailPage'
import { AdminUsersPage } from '@/features/admin/AdminUsersPage'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { EditEntryPage, NewEntryPage } from '@/features/entries/EntryFormPages'
import { MyEntriesPage } from '@/features/entries/MyEntriesPage'

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'entries', element: <MyEntriesPage /> },
          { path: 'entries/new', element: <NewEntryPage /> },
          { path: 'entries/:id/edit', element: <EditEntryPage /> },
          { path: 'profile', element: <ComingSoonPage title="My Profile" phase={5} /> },
          {
            path: 'admin',
            element: <AdminRoute />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { index: true, element: <AdminEntriesPage /> },
                  { path: 'users', element: <AdminUsersPage /> },
                  { path: 'users/:id', element: <AdminUserDetailPage /> },
                ],
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
