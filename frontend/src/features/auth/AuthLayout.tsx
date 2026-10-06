import type { ReactNode } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import logo from '@/assets/onefic-logo.png'
import { FicMap } from '@/features/map/FicMap'
import { cn } from '@/lib/utils'

/**
 * Shared frame for /login and /register. It stays mounted while you switch between them,
 * so the map keeps its position and only the form panel animates in.
 */
export function AuthLayout() {
  const { pathname } = useLocation()

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Logo and form share one centered column, so wide screens don't strand the form at the edge. */}
      {/* Logo and form share one centered column, so wide screens don't strand the form at the edge. */}
      <div className="flex justify-center px-4 py-8 sm:px-10 lg:py-12">
        <main className="flex w-full max-w-md flex-col justify-center">
          <Link
            to="/login"
            className="mb-10 block w-fit rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <img src={logo} alt="OneFIC - Philippine Food Innovation Network" width={720} height={270} className="h-auto w-64 sm:w-80" />
          </Link>

          <div key={pathname} className="w-full auth-panel-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Explore the region while you sign in. Stays put while the left side scrolls. */}
      <div className="relative hidden border-l lg:sticky lg:top-0 lg:block lg:h-dvh">
        <div className="absolute inset-0 isolate">
          <FicMap />
        </div>
      </div>
    </div>
  )
}

type AuthPanelProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function AuthPanel({ title, subtitle, children, footer, className }: AuthPanelProps) {
  return (
    <div className={cn(className)}>
      <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
      <p className="mt-2 text-sm text-pretty text-muted-foreground">{subtitle}</p>
      <div className="mt-8">{children}</div>
      {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
    </div>
  )
}
