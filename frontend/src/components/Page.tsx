import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageProps = {
  title: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** A scrollable page inside the app shell, with a title row. */
export function Page({ title, actions, children, className }: PageProps) {
  return (
    // relative: contains Radix's hidden, absolutely positioned form inputs inside this scroller.
    <main className="relative min-h-0 overflow-y-auto">
      <div className={cn('mx-auto w-full max-w-5xl px-4 py-8 sm:px-8', className)}>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {actions}
        </div>
        {children}
      </div>
    </main>
  )
}
