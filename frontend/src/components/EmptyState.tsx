import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-start gap-3', className)}>
      <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground" aria-hidden>
        <Icon className="size-5" />
      </span>
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 max-w-[52ch] text-sm text-pretty text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}
