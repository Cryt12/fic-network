import logo from '@/assets/logo.png'
import { cn } from '@/lib/utils'

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <img src={logo} alt="" width={28} height={28} className="size-7 shrink-0" />
      Philippine Food Innovation Network
    </span>
  )
}
