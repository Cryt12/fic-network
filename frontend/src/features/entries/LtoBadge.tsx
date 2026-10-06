import { Badge } from '@/components/ui/badge'
import { LTO_STATUSES, optionLabel } from '@/features/entries/fields'
import { cn } from '@/lib/utils'

const LTO_TONE: Record<string, string> = {
  with_valid_lto: 'bg-accent text-accent-foreground',
  in_process: 'bg-secondary text-secondary-foreground',
  no_lto: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
  not_applicable: 'bg-muted text-muted-foreground',
}

export function LtoBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="secondary" className={cn('font-medium', LTO_TONE[status], className)}>
      {optionLabel(LTO_STATUSES, status)}
    </Badge>
  )
}
