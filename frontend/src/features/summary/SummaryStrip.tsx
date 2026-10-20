import { Skeleton } from '@/components/ui/skeleton'
import type { Summary } from '@/features/summary/api'
import { COMMERCIALIZED, DEVELOPED, number, percent } from '@/features/summary/chart-style'
import { cn } from '@/lib/utils'

/*
 * Five cells: 2 columns on phones, 3 on tablets, 5 in a row on wide screens. The last cell
 * spans the leftover columns, so no row ends in an empty gap. gap-px over bg-border draws the
 * dividing lines for any of those layouts.
 */
const LAST_CELL = 'col-span-2 sm:col-span-2 xl:col-span-1'

/** National headline numbers, as a strip above the map. */
export function SummaryStrip({ summary, isPending }: { summary: Summary | undefined; isPending: boolean }) {
  if (isPending || !summary) {
    return (
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3 xl:grid-cols-5" aria-busy="true" aria-label="Loading summary">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={cn('grid gap-2 bg-card px-5 py-4', i === 4 && LAST_CELL)}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        ))}
      </div>
    )
  }

  const { national, regions, equipment_types: equipmentTypes } = summary
  const rate = national.products_developed > 0 ? percent.format(national.products_commercialized / national.products_developed) : '-'
  const stats = [
    { label: 'FICs nationwide', value: number.format(national.fics), detail: `in ${national.regions_with_fics} of ${regions.length} regions` },
    { label: 'Products developed', value: number.format(national.products_developed), swatch: DEVELOPED, detail: 'by all FICs' },
    { label: 'Commercialized', value: number.format(national.products_commercialized), swatch: COMMERCIALIZED, detail: 'adopted through TLA' },
    { label: 'Commercialization rate', value: rate, detail: 'of products developed' },
    {
      label: 'FIC equipment',
      value: number.format(national.equipment),
      detail: `${national.equipment === 1 ? 'unit' : 'units'} of ${equipmentTypes.length} equipment ${equipmentTypes.length === 1 ? 'type' : 'types'}`,
    },
  ]

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat, i) => (
        <div key={stat.label} className={cn('min-w-0 bg-card px-4 py-4 sm:px-5', i === stats.length - 1 && LAST_CELL)}>
          <dt className="flex items-start gap-2 text-sm leading-snug font-medium text-muted-foreground sm:items-center">
            {stat.swatch && <span className="mt-1 size-2.5 shrink-0 rounded-[3px] sm:mt-0" style={{ background: stat.swatch }} aria-hidden />}
            <span className="text-pretty sm:truncate">{stat.label}</span>
          </dt>
          <dd className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{stat.value}</dd>
          <dd className="mt-1 truncate text-sm text-muted-foreground">{stat.detail}</dd>
        </div>
      ))}
    </dl>
  )
}
