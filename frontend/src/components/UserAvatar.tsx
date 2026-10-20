import { cn } from '@/lib/utils'

const SIZES = { sm: 'size-9 text-xs', md: 'size-12 text-sm', lg: 'size-20 text-xl' } as const

/** "Maria Clara Santos" -> "MS" */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

/** Profile photo, or the account's initials on brand green when there is none. */
export function UserAvatar({ name, url, size = 'md', className }: { name: string; url: string | null; size?: keyof typeof SIZES; className?: string }) {
  return url ? (
    <img src={url} alt="" className={cn('shrink-0 rounded-full border bg-muted object-cover', SIZES[size], className)} />
  ) : (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground', SIZES[size], className)}
    >
      {initials(name)}
    </span>
  )
}
