import type { ReactNode } from 'react'
import { FileSpreadsheet, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/ErrorState'
import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadDashboardData } from '@/features/admin/api'
import { useCurrentUser } from '@/features/auth/current-user'
import { AssistanceRegionGrid } from '@/features/summary/AssistanceChart'
import { useSummary, type RegionSummary, type Summary } from '@/features/summary/api'
import { Bar, LegendItem } from '@/features/summary/chart'
import { COMMERCIALIZED, DEVELOPED, number, percent, shortRegion } from '@/features/summary/chart-style'
import { AssistanceNationwide, EquipmentByRegion, EquipmentByType, MsmePartnersByRegion, PersonnelByRegion, SectionHeading } from '@/features/summary/SummarySections'
import { errorMessage } from '@/lib/api'
import { useDocumentTitle } from '@/lib/use-document-title'

export function SummaryPage() {
  useDocumentTitle('Summary')
  const { data, isPending, isError, error, refetch } = useSummary()

  useEffect(() => {
    if (isError) toast.error(`Couldn't load the summary. ${errorMessage(error)}`, { id: 'summary-error' })
  }, [isError, error])

  const user = useCurrentUser()

  return (
    <Page title="Summary" className="max-w-6xl" actions={user.can_view_all_entries && <DownloadButton />}>
      <p className="-mt-6 mb-8 max-w-[65ch] text-sm text-muted-foreground">
        Every Dashboard figure in one place: Food Innovation Centers, products, Food MSME partners, assistance requested and FIC equipment, nationwide and by
        region. Updated as members add and edit entries.
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
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-y py-6 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="FICs nationwide" value={number.format(national.fics)} detail={`in ${national.regions_with_fics} of ${regions.length} regions`} />
        <Stat label="Products developed" value={number.format(national.products_developed)} swatch={DEVELOPED} />
        <Stat
          label="Commercialized"
          value={number.format(national.products_commercialized)}
          swatch={COMMERCIALIZED}
          detail={rate === null ? 'no products yet' : `${percent.format(rate)} of products developed`}
        />
        <Stat
          label="FIC personnel"
          value={number.format(national.fulltime_personnel + national.associate_personnel)}
          detail={
            national.personnel_reported > 0
              ? `${number.format(national.fulltime_personnel)} full-time, ${number.format(national.associate_personnel)} associate`
              : 'not reported yet'
          }
        />
        <Stat
          label="Food MSME partners"
          value={number.format(national.msme_partners)}
          detail={national.msme_partners > 0 ? `${number.format(national.msmes_with_lto)} with LTO` : 'none reported yet'}
        />
        <Stat label="FIC equipment" value={number.format(national.equipment)} detail={`units of ${summary.equipment_types.length} types`} />
      </dl>

      <div className="grid gap-12 xl:grid-cols-2">
        <FicsByRegion regions={regions} />
        <ProductsByRegion regions={regions} />
      </div>

      <div className="grid gap-12 xl:grid-cols-2">
        <PersonnelByRegion summary={summary} />
        <MsmePartnersByRegion summary={summary} />
      </div>

      <AssistanceNationwide summary={summary} />

      <section aria-labelledby="assistance-by-region">
        <SectionHeading
          id="assistance-by-region"
          title="Assistance requested, by region"
          description="FICs in each region whose MSMEs requested each type. Darker cells are a larger share of the region's FICs."
        />
        <AssistanceRegionGrid summary={summary} />
      </section>

      <EquipmentByType summary={summary} />
      <EquipmentByRegion summary={summary} />

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

/** Every number, every region: the accessible table view of the region charts. */
function RegionTable({ summary }: { summary: Summary }) {
  const rate = (r: { products_developed: number; products_commercialized: number }) =>
    r.products_developed > 0 ? percent.format(r.products_commercialized / r.products_developed) : '-'
  const units = (r: RegionSummary) => Object.values(r.equipment.operation).reduce((a, b) => a + b, 0)

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
              <TableHead className="h-auto py-2 text-right whitespace-normal">Products developed</TableHead>
              <TableHead className="h-auto py-2 text-right whitespace-normal">Products commercialized</TableHead>
              <TableHead className="h-auto py-2 text-right whitespace-normal">Commercialization rate</TableHead>
              <TableHead className="h-auto py-2 text-right whitespace-normal">Food MSME partners</TableHead>
              <TableHead className="h-auto py-2 text-right whitespace-normal">With LTO</TableHead>
              <TableHead className="h-auto py-2 pr-4 text-right whitespace-normal">Equipment units</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.regions.map((region) => (
              <TableRow key={region.code} className={region.fics === 0 ? 'text-muted-foreground' : undefined}>
                <TableCell className="min-w-44 pl-4 whitespace-normal">{region.name}</TableCell>
                <TableCell className="text-right tabular-nums">{number.format(region.fics)}</TableCell>
                <TableCell className="text-right tabular-nums">{number.format(region.products_developed)}</TableCell>
                <TableCell className="text-right tabular-nums">{number.format(region.products_commercialized)}</TableCell>
                <TableCell className="text-right tabular-nums">{rate(region)}</TableCell>
                <TableCell className="text-right tabular-nums">{number.format(region.msme_partners)}</TableCell>
                <TableCell className="text-right tabular-nums">{number.format(region.msmes_with_lto)}</TableCell>
                <TableCell className="pr-4 text-right tabular-nums">{number.format(units(region))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-semibold">
              <TableCell className="pl-4">Philippines (national)</TableCell>
              <TableCell className="text-right tabular-nums">{number.format(summary.national.fics)}</TableCell>
              <TableCell className="text-right tabular-nums">{number.format(summary.national.products_developed)}</TableCell>
              <TableCell className="text-right tabular-nums">{number.format(summary.national.products_commercialized)}</TableCell>
              <TableCell className="text-right tabular-nums">{rate(summary.national)}</TableCell>
              <TableCell className="text-right tabular-nums">{number.format(summary.national.msme_partners)}</TableCell>
              <TableCell className="text-right tabular-nums">{number.format(summary.national.msmes_with_lto)}</TableCell>
              <TableCell className="pr-4 text-right tabular-nums">{number.format(summary.national.equipment)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </section>
  )
}

/** The same numbers as one Excel workbook (superadmin and DOST FIC Focal accounts). */
function DownloadButton() {
  const [downloading, setDownloading] = useState(false)

  const download = async () => {
    setDownloading(true)
    try {
      await downloadDashboardData()
      toast.success('Dashboard data downloaded.')
    } catch (e) {
      toast.error(`Couldn't generate the Excel file. ${errorMessage(e)}`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button variant="outline" onClick={download} disabled={downloading}>
      {downloading ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <FileSpreadsheet data-icon="inline-start" />}
      {downloading ? 'Preparing...' : 'Download Excel'}
    </Button>
  )
}

function SummarySkeleton() {
  return (
    <div className="flex flex-col gap-12" aria-busy="true" aria-label="Loading summary">
      <div className="grid grid-cols-2 gap-6 border-y py-6 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
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
