import { Badge } from '@/components/ui/badge'
import type { LoginEvent } from '@/features/admin/api'
import { cn } from '@/lib/utils'

const RESULTS: Record<LoginEvent['result'], { label: string; tone: string }> = {
  success: { label: 'Logged in', tone: 'bg-accent text-accent-foreground' },
  wrong_password: { label: 'Wrong password', tone: 'bg-destructive/10 text-destructive' },
  locked_out: { label: 'Blocked: too many tries', tone: 'bg-destructive text-white' },
  unknown_email: { label: 'Unknown email', tone: 'bg-muted text-muted-foreground' },
}

export function LoginResultBadge({ result }: { result: LoginEvent['result'] }) {
  const { label, tone } = RESULTS[result]
  return (
    <Badge variant="secondary" className={cn('font-medium', tone)}>
      {label}
    </Badge>
  )
}
