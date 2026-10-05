import { Navigate, Outlet, useLocation } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ErrorState'
import { useMe } from '@/features/auth/api'
import { CurrentUserContext, useCurrentUser } from '@/features/auth/current-user'
import { NotFoundPage } from '@/app/NotFoundPage'

function FullPageLoading() {
  return (
    <div className="grid h-dvh grid-rows-[auto_1fr]" aria-busy="true" aria-label="Loading">
      <div className="flex h-14 items-center gap-3 border-b px-3">
        <Skeleton className="size-9" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="m-3 rounded-lg" />
    </div>
  )
}

/** Logged-in users only. Everyone else goes to /login and comes back afterwards. */
export function ProtectedRoute() {
  const { data: user, isPending, isError, error, refetch } = useMe()
  const location = useLocation()

  if (isPending) return <FullPageLoading />
  if (isError) return <ErrorState className="h-dvh" error={error} onRetry={() => refetch()} />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />

  return (
    <CurrentUserContext value={user}>
      <Outlet />
    </CurrentUserContext>
  )
}

/** Login / signup pages: logged-in users are sent to the dashboard. */
export function GuestRoute() {
  const { data: user, isPending } = useMe()

  if (isPending) return null
  if (user) return <Navigate to="/" replace />

  return <Outlet />
}

/** Superadmin-only pages look like they don't exist to everyone else. The API enforces this too. */
export function AdminRoute() {
  const user = useCurrentUser()

  if (!user.is_superadmin) return <NotFoundPage />

  return <Outlet />
}
