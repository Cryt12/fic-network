import type { ReactNode } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Wordmark } from '@/components/Wordmark'
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
      <div className="flex justify-center px-4 py-6 sm:px-10 lg:py-10">
        <div className="flex w-full max-w-md flex-col">
          <Link to="/login" className="w-fit rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
            <Wordmark />
          </Link>

          <main className="flex flex-1 items-center py-10">
            <div key={pathname} className="w-full auth-panel-enter">
              <Outlet />
            </div>
          </main>
        </div>
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
