import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Wordmark } from '@/components/Wordmark'
import { FicMap } from '@/features/map/FicMap'

type AuthLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="flex flex-col px-4 py-6 sm:px-10 lg:px-16 lg:py-10">
        <Link to="/login" className="w-fit rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
          <Wordmark />
        </Link>

        <main className="flex flex-1 items-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
          </div>
        </main>
      </div>

      {/* The region the network covers. Decorative, so hidden from assistive tech. */}
      <div className="relative hidden border-l lg:block" aria-hidden>
        <FicMap interactive={false} />
      </div>
    </div>
  )
}
