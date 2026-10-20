import type { ReactNode } from 'react'
import { number, percent } from '@/features/summary/chart-style'
import { COLORS, OPTIONS, type View } from '@/features/summary/equipment-style'
import { cn } from '@/lib/utils'

type Bar = { name?: string; total?: number }

/**
 * Tooltip rows for a stacked equipment bar: each status as a share of the bar's units,
 * "27%   4 of 15", so bars of different sizes compare at a glance.
 */
export function shareFormatter(view: View) {
  return function ShareRow(value: unknown, name: unknown, _item: unknown, _index: number, payload: unknown): ReactNode {
    const status = String(name)
    const count = Number(value) || 0
    const total = (payload as Bar | undefined)?.total ?? 0
    const label = OPTIONS[view].find((o) => o.value === status)?.label ?? status

    return (
      <div className={cn('flex w-full items-center gap-2', count === 0 && 'opacity-55')}>
        <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: COLORS[view][status] }} aria-hidden />
        <span className="flex-1 text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground tabular-nums">{total > 0 ? percent.format(count / total) : '0%'}</span>
        <span className="w-16 text-right text-muted-foreground tabular-nums">
          {count} of {total}
        </span>
      </div>
    )
  }
}

/** Tooltip heading: "Spray dryer · 16 units" (the bar's own name, or the full region name). */
export function totalLabel(_label: unknown, payload: readonly { payload?: Bar }[]): ReactNode {
  const bar = payload[0]?.payload
  if (!bar) return ''
  const units = bar.total ?? 0
  return (
    <span>
      {bar.name} <span className="font-normal text-muted-foreground">· {number.format(units)} {units === 1 ? 'unit' : 'units'}</span>
    </span>
  )
}
