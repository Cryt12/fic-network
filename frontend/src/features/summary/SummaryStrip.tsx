import { Skeleton } from '@/components/ui/skeleton'
import type { Summary } from '@/features/summary/api'
import { COMMERCIALIZED, DEVELOPED, number, percent } from '@/features/summary/chart-style'

/** National headline numbers, as a compact strip above the map. */
export function SummaryStrip({ summary, isPending }: { summary: Summary | undefined; isPending: boolean }) {
  if (isPending || !summary) {
    return (
      <div className="grid grid-cols-4 gap-4 rounded-lg border bg-card px-4 py-3" aria-busy="true" aria-label="Loading summary">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="grid gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    )
  }

  const { national, regions } = summary
  const rate = national.products_developed > 0 ? percent.format(national.products_commercialized / national.products_developed) : '-'
  const stats = [
    { label: 'FICs nationwide', value: number.format(national.fics), detail: `${national.regions_with_fics} of ${regions.length} regions` },
    { label: 'Products developed', value: number.format(national.products_developed), swatch: DEVELOPED },
    { label: 'Commercialized', value: number.format(national.products_commercialized), swatch: COMMERCIALIZED },
    { label: 'Commercialization rate', value: rate, detail: 'of products developed' },
  ]

  return (
    <dl className="grid grid-cols-2 divide-x divide-y rounded-lg border bg-card sm:grid-cols-4 sm:divide-y-0">
      {stats.map((stat) => (
        <div key={stat.label} className="px-3 py-2.5 sm:px-4 sm:py-3">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {stat.swatch && <span className="size-2 shrink-0 rounded-[2px]" style={{ background: stat.swatch }} aria-hidden />}
            <span className="truncate">{stat.label}</span>
          </dt>
          <dd className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{stat.value}</span>
            {stat.detail && <span className="hidden truncate text-xs text-muted-foreground lg:inline">{stat.detail}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
