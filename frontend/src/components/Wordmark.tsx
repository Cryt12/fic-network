import logo from '@/assets/onefic-logo.png'
import { cn } from '@/lib/utils'

/** The OneFIC logo (includes the full name), sized for headers. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="OneFIC - Philippine Food Innovation Network"
      width={720}
      height={270}
      className={cn('h-10 w-auto shrink-0', className)}
    />
  )
}
