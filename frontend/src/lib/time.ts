import { useEffect, useState } from 'react'

const exactFormat = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** "Oct 5, 2026, 4:23 PM" */
export function formatExact(date: Date | string): string {
  return exactFormat.format(new Date(date))
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`
}

/** "just now", "5 mins ago", "2 hrs ago", "3 days ago", then the date. */
export function formatRelative(date: Date | string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(date).getTime()) / 1000))

  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return plural(minutes, 'min')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return plural(hours, 'hr')
  const days = Math.round(hours / 24)
  if (days < 7) return plural(days, 'day')

  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date(date))
}

/** Re-renders the caller every `intervalMs` so relative times stay current. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
