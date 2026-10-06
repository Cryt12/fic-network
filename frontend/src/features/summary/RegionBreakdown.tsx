import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { RegionSummary } from '@/features/summary/api'
import { LegendItem } from '@/features/summary/chart'
import { COMMERCIALIZED, DEVELOPED, number, shortRegion } from '@/features/summary/chart-style'

type RegionBreakdownProps = {
  regions: RegionSummary[] | undefined
  isPending: boolean
  onSelectRegion: (code: string) => void
}

/** Per-region FICs and products, beside the map. Picking a region zooms the map to it. */
export function RegionBreakdown({ regions, isPending, onSelectRegion }: RegionBreakdownProps) {
  const withFics = (regions ?? []).filter((r) => r.fics > 0).sort((a, b) => b.fics - a.fics || b.products_developed - a.products_developed)
  const without = (regions ?? []).filter((r) => r.fics === 0)
  const max = Math.max(1, ...withFics.map((r) => r.products_developed))

  return (
    <section aria-label="FICs by region" className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 px-4 pt-4 pb-3">
        <ul className="flex gap-4 text-xs text-muted-foreground" aria-label="Legend">
          <LegendItem color={DEVELOPED} label="Developed" />
          <LegendItem color={COMMERCIALIZED} label="Commercialized" />
        </ul>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        {isPending ? (
          <div className="flex flex-col gap-4 px-4 py-2" aria-busy="true" aria-label="Loading regions">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="grid gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2.5 w-3/4" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-2 pb-4">
            {withFics.length === 0 && <p className="px-2 py-4 text-sm text-muted-foreground">No FICs registered yet.</p>}
            <ul>
              {withFics.map((region) => (
                <li key={region.code}>
                  <button
                    type="button"
                    onClick={() => onSelectRegion(region.code)}
                    className="w-full rounded-md px-2 py-2.5 text-left outline-none transition-colors hover:bg-background focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
                    title={`Show ${region.name} on the map`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{shortRegion(region.name)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {region.fics} FIC{region.fics === 1 ? '' : 's'}
                      </span>
                    </span>
                    <MiniBar value={region.products_developed} max={max} color={DEVELOPED} label="developed" />
                    <MiniBar value={region.products_commercialized} max={max} color={COMMERCIALIZED} label="commercialized" />
                  </button>
                </li>
              ))}
            </ul>

            {without.length > 0 && (
              <p className="mt-3 px-2 text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">No FICs yet:</span> {without.map((r) => shortRegion(r.name)).join(', ')}
              </p>
            )}

            <Link
              to="/summary"
              className="mt-4 ml-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Full summary table
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        )}
      </ScrollArea>
    </section>
  )
}

function MiniBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  return (
    <span className="mt-1.5 flex items-center gap-2" aria-label={`${number.format(value)} products ${label}`}>
      {value > 0 && (
        <span className="h-2 rounded-r-[4px]" style={{ width: `calc((100% - 2.5rem) * ${value / max})`, minWidth: 3, background: color }} aria-hidden />
      )}
      <span className="text-xs text-foreground tabular-nums" aria-hidden>
        {number.format(value)}
      </span>
    </span>
  )
}
