import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/app/AppShell'
import { AdminRoute, CanAddEntriesRoute, CanAddMsmeReportsRoute, GuestRoute, ProtectedRoute, ViewAllEntriesRoute } from '@/app/guards'
import { NotFoundPage } from '@/app/NotFoundPage'
import { AdminEntriesPage } from '@/features/admin/AdminEntriesPage'
import { AdminLayout } from '@/features/admin/AdminLayout'
import { AdminUserDetailPage } from '@/features/admin/AdminUserDetailPage'
import { AdminUsersPage } from '@/features/admin/AdminUsersPage'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { EditEntryPage, NewEntryPage } from '@/features/entries/EntryFormPages'
import { MyEntriesPage } from '@/features/entries/MyEntriesPage'
import { EditMsmeReportPage, NewMsmeReportPage } from '@/features/msme-reports/MsmeReportFormPages'
import { MyMsmeReportsPage } from '@/features/msme-reports/MyMsmeReportsPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { SummaryPage } from '@/features/summary/SummaryPage'

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
        // After the superadmin resets a password: same frame as login, nothing else reachable.
        element: <AuthLayout />,
        children: [{ path: '/change-password', element: <ChangePasswordPage /> }],
      },
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'summary', element: <SummaryPage /> },
          {
            element: <CanAddEntriesRoute />,
            children: [
              { path: 'entries', element: <MyEntriesPage /> },
              { path: 'entries/new', element: <NewEntryPage /> },
              { path: 'entries/:id/edit', element: <EditEntryPage /> },
            ],
          },
          {
            // DOST FIC Focal accounts: Food MSME partners in their region (their only entries).
            element: <CanAddMsmeReportsRoute />,
            children: [
              { path: 'msme-reports', element: <MyMsmeReportsPage /> },
              { path: 'msme-reports/new', element: <NewMsmeReportPage /> },
              { path: 'msme-reports/:id/edit', element: <EditMsmeReportPage /> },
            ],
          },
          {
            // DOST FIC Focal accounts: every FIC's data, read-only, with the Excel report.
            path: 'data',
            element: <ViewAllEntriesRoute />,
            children: [{ index: true, element: <AdminEntriesPage /> }],
          },
          { path: 'profile', element: <ProfilePage /> },
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
