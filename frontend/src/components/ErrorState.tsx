import { RotateCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

type ErrorStateProps = {
  error: unknown
  onRetry?: () => void
  className?: string
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn('grid place-items-center p-6', className)}>
      <div className="flex max-w-sm flex-col items-start gap-3">
        <TriangleAlert className="size-6 text-destructive" aria-hidden />
        <div>
          <h2 className="text-base font-semibold tracking-tight">Something went wrong</h2>
          <p className="mt-1 text-sm text-muted-foreground">{errorMessage(error)}</p>
        </div>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RotateCw data-icon="inline-start" />
            Try again
          </Button>
        )}
      </div>
    </div>
  )
}
