import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import type { RegionSummary, Summary } from '@/features/summary/api'
import { COMMERCIALIZED, DEVELOPED, number, percent } from '@/features/summary/chart-style'
import { ChartCard, ScrollX } from '@/features/summary/RegionCharts'
import { cn } from '@/lib/utils'

const config = {
  msme_partners: { label: 'Food MSME partners', color: DEVELOPED },
  msmes_with_lto: { label: 'With LTO', color: COMMERCIALIZED },
} satisfies ChartConfig

/** Tooltips show the full region name; the axis uses the short code (NCR, CAR, I ... BARMM). */
const fullName = (_: unknown, payload: readonly { payload?: RegionSummary }[]) => payload[0]?.payload?.name ?? ''

const valueLabel = (v: unknown) => (Number(v) > 0 ? number.format(Number(v)) : '')

/** Food MSME partners per region, as reported by DOST FIC Focal accounts, and how many hold an LTO. */
export function MsmePartnersChart({ summary, isPending, className }: { summary: Summary | undefined; isPending: boolean; className?: string }) {
  if (isPending || !summary) {
    return (
      <div className={cn('rounded-lg border bg-card p-4', className)} aria-busy="true" aria-label="Loading chart">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-4 h-64" />
      </div>
    )
  }

  const { msme_partners: partners, msmes_with_lto: withLto } = summary.national
  const description =
    partners > 0
      ? `Reported by DOST FIC Focal accounts. Nationwide: ${number.format(partners)} partners, ${number.format(withLto)} with LTO (${percent.format(withLto / partners)}).`
      : 'Reported by DOST FIC Focal accounts for their regions.'

  return (
    <div className={className}>
      <ChartCard title="Food MSME partners per region" description={description}>
        {partners === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No Food MSME partners reported yet. DOST FIC Focal accounts add them under Add New Entry.
          </p>
        ) : (
          <ScrollX>
            <ChartContainer config={config} className="h-80 w-full min-w-[520px]">
              <BarChart data={summary.regions} margin={{ top: 20, right: 4, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="code" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} fontSize={11} />
                <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent labelFormatter={fullName} />} />
                <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
                <Bar dataKey="msme_partners" fill="var(--color-msme_partners)" radius={[4, 4, 0, 0]} maxBarSize={22}>
                  <LabelList dataKey="msme_partners" position="top" fontSize={10} className="fill-foreground" formatter={valueLabel} />
                </Bar>
                <Bar dataKey="msmes_with_lto" fill="var(--color-msmes_with_lto)" radius={[4, 4, 0, 0]} maxBarSize={22}>
                  <LabelList dataKey="msmes_with_lto" position="top" fontSize={10} className="fill-foreground" formatter={valueLabel} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </ScrollX>
        )}
      </ChartCard>
    </div>
  )
}
