import { Sprout } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground" aria-hidden>
        <Sprout className="size-4" strokeWidth={2} />
      </span>
      FIC Network
    </span>
  )
}
