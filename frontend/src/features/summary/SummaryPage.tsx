import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/ErrorState'
import { Page } from '@/components/Page'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSummary, type RegionSummary, type Summary } from '@/features/summary/api'
import { Bar, LegendItem } from '@/features/summary/chart'
import { COMMERCIALIZED, DEVELOPED, number, percent, shortRegion } from '@/features/summary/chart-style'
import { errorMessage } from '@/lib/api'
import { useDocumentTitle } from '@/lib/use-document-title'

export function SummaryPage() {
  useDocumentTitle('Summary')
  const { data, isPending, isError, error, refetch } = useSummary()

  useEffect(() => {
    if (isError) toast.error(`Couldn't load the summary. ${errorMessage(error)}`, { id: 'summary-error' })
  }, [isError, error])

  return (
    <Page title="Summary" className="max-w-6xl">
      <p className="-mt-6 mb-8 max-w-[65ch] text-sm text-muted-foreground">
        Food Innovation Centers across the Philippines, by region. Updated as members add and edit entries.
      </p>

      {isPending ? (
        <SummarySkeleton />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} className="py-16" />
      ) : (
        <SummaryContent summary={data} />
      )}
    </Page>
  )
}

function SummaryContent({ summary }: { summary: Summary }) {
  const { national, regions } = summary
  const rate = national.products_developed > 0 ? national.products_commercialized / national.products_developed : null

  return (
    <div className="flex flex-col gap-12">
      {/* Headline numbers */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-y py-6 lg:grid-cols-4">
        <Stat label="FICs nationwide" value={number.format(national.fics)} detail={`in ${national.regions_with_fics} of ${regions.length} regions`} />
        <Stat label="Products developed" value={number.format(national.products_developed)} swatch={DEVELOPED} />
        <Stat label="Products commercialized" value={number.format(national.products_commercialized)} swatch={COMMERCIALIZED} />
        <Stat label="Commercialized" value={rate === null ? 'None yet' : percent.format(rate)} detail="of products developed" />
      </dl>

      <div className="grid gap-12 xl:grid-cols-2">
        <FicsByRegion regions={regions} />
        <ProductsByRegion regions={regions} />
      </div>

      <RegionTable summary={summary} />
    </div>
  )
}

function Stat({ label, value, detail, swatch }: { label: string; value: string; detail?: string; swatch?: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {swatch && <span className="size-2.5 rounded-[3px]" style={{ background: swatch }} aria-hidden />}
        {label}
      </dt>
      <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</dd>
      {detail && <dd className="mt-0.5 text-xs text-muted-foreground">{detail}</dd>}
    </div>
  )
}

/** Number of FICs per region, most first. Regions without FICs are listed once, below. */
function FicsByRegion({ regions }: { regions: RegionSummary[] }) {
  const withFics = regions.filter((r) => r.fics > 0).sort((a, b) => b.fics - a.fics)
  const without = regions.filter((r) => r.fics === 0)
  const max = Math.max(1, ...withFics.map((r) => r.fics))

  return (
    <section aria-labelledby="fics-by-region">
      <h2 id="fics-by-region" className="text-base font-semibold tracking-tight">
        FICs per region
      </h2>
      {withFics.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No FICs registered yet.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-2.5">
          {withFics.map((region) => (
            <BarRow key={region.code} label={shortRegion(region.name)} fullLabel={region.name}>
              <Bar value={region.fics} max={max} color={DEVELOPED} tooltip={`${region.name}: ${region.fics} FIC${region.fics === 1 ? '' : 's'}`} />
            </BarRow>
          ))}
        </ul>
      )}
      {without.length > 0 && (
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">No FICs yet:</span> {without.map((r) => shortRegion(r.name)).join(', ')}
        </p>
      )}
    </section>
  )
}

/** Products developed vs. commercialized, per region that has FICs. */
function ProductsByRegion({ regions }: { regions: RegionSummary[] }) {
  const rows = regions.filter((r) => r.fics > 0).sort((a, b) => b.products_developed - a.products_developed)
  const max = Math.max(1, ...rows.map((r) => r.products_developed))

  return (
    <section aria-labelledby="products-by-region">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="products-by-region" className="text-base font-semibold tracking-tight">
          Products per region
        </h2>
        <ul className="flex gap-4 text-xs text-muted-foreground" aria-label="Legend">
          <LegendItem color={DEVELOPED} label="Developed" />
          <LegendItem color={COMMERCIALIZED} label="Commercialized" />
        </ul>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No products recorded yet.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3.5">
          {rows.map((region) => (
            <BarRow key={region.code} label={shortRegion(region.name)} fullLabel={region.name}>
              <div className="flex flex-col gap-0.5">
                <Bar value={region.products_developed} max={max} color={DEVELOPED} tooltip={`${region.name}: ${region.products_developed} developed`} />
                <Bar
                  value={region.products_commercialized}
                  max={max}
                  color={COMMERCIALIZED}
                  tooltip={`${region.name}: ${region.products_commercialized} commercialized`}
                />
              </div>
            </BarRow>
          ))}
        </ul>
      )}
    </section>
  )
}

function BarRow({ label, fullLabel, children }: { label: string; fullLabel: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <span className="truncate text-right text-sm text-muted-foreground" title={fullLabel}>
        {label}
      </span>
      {children}
    </li>
  )
}

/** Every number, every region: the accessible table view of both charts. */
function RegionTable({ summary }: { summary: Summary }) {
  const rate = (r: { products_developed: number; products_commercialized: number }) =>
    r.products_developed > 0 ? percent.format(r.products_commercialized / r.products_developed) : '-'

  return (
    <section aria-labelledby="by-region-table">
      <h2 id="by-region-table" className="mb-4 text-base font-semibold tracking-tight">
        All regions
      </h2>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="pl-4">Region</TableHead>
              <TableHead className="text-right">FICs</TableHead>
              <TableHead className="text-right">Products developed</TableHead>
              <TableHead className="text-right">Products commercialized</TableHead>
              <TableHead className="pr-4 text-right">Commercialized</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.regions.map((region) => (
              <TableRow key={region.code} className={region.fics === 0 ? 'text-muted-foreground' : undefined}>
                <TableCell className="pl-4">{region.name}</TableCell>
                <TableCell className="text-right tabular-nums">{number.format(region.fics)}</TableCell>
                <TableCell className="text-right tabular-nums">{number.format(region.products_developed)}</TableCell>
                <TableCell className="text-right tabular-nums">{number.format(region.products_commercialized)}</TableCell>
                <TableCell className="pr-4 text-right tabular-nums">{rate(region)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-semibold">
              <TableCell className="pl-4">Philippines (national)</TableCell>
              <TableCell className="text-right tabular-nums">{number.format(summary.national.fics)}</TableCell>
              <TableCell className="text-right tabular-nums">{number.format(summary.national.products_developed)}</TableCell>
              <TableCell className="text-right tabular-nums">{number.format(summary.national.products_commercialized)}</TableCell>
              <TableCell className="pr-4 text-right tabular-nums">{rate(summary.national)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </section>
  )
}

function SummarySkeleton() {
  return (
    <div className="flex flex-col gap-12" aria-busy="true" aria-label="Loading summary">
      <div className="grid grid-cols-2 gap-6 border-y py-6 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="grid gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-12 xl:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="grid gap-3">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 6 }, (_, j) => (
              <Skeleton key={j} className="h-4" style={{ width: `${90 - j * 12}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
