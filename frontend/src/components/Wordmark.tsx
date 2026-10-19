import logo from '@/assets/onefic-logo.png'
import { cn } from '@/lib/utils'

/** "DOST" + the OneFIC logo, for headers. DOST is set in the logo's own typeface and green. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {/* Nudged down so it centers on the big OneFIC letters, not on the whole image (which has the tagline under it). */}
      <span className="font-brand translate-y-[5px] text-[26px] leading-none font-extrabold tracking-tight text-[#003c28]" aria-hidden>
        DOST
      </span>
      <img src={logo} alt="DOST OneFIC - Philippine Food Innovation Network" width={720} height={270} className="h-14 w-auto shrink-0" />
    </span>
  )
}
