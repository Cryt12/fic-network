import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import type { RegionSummary } from '@/features/summary/api'
import { COMMERCIALIZED, DEVELOPED } from '@/features/summary/chart-style'

const ficsConfig = {
  fics: { label: 'FICs', color: DEVELOPED },
} satisfies ChartConfig

const productsConfig = {
  products_developed: { label: 'Developed', color: DEVELOPED },
  products_commercialized: { label: 'Commercialized', color: COMMERCIALIZED },
} satisfies ChartConfig

/** Tooltips show the full region name; the axis uses the short code (NCR, CAR, I ... BARMM). */
const fullName = (_: unknown, payload: readonly { payload?: RegionSummary }[]) => payload[0]?.payload?.name ?? ''

/** Column charts of every region, in the official order: FICs, and products developed vs. commercialized. */
export function RegionCharts({ regions, isPending }: { regions: RegionSummary[] | undefined; isPending: boolean }) {
  if (isPending || !regions) {
    return (
      <div className="grid gap-6 xl:grid-cols-2" aria-busy="true" aria-label="Loading charts">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-4 h-64" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ChartCard title="FICs per region" description="Number of Food Innovation Centers in each region.">
        <ChartContainer config={ficsConfig} className="h-72 w-full">
          <BarChart data={regions} margin={{ top: 20, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="code" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={11} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} fontSize={11} />
            <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent labelFormatter={fullName} />} />
            <Bar dataKey="fics" fill="var(--color-fics)" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {/* Value on top of each bar that has one; zeros stay unlabeled. */}
              <LabelList dataKey="fics" position="top" fontSize={11} className="fill-foreground" formatter={(v: unknown) => (Number(v) > 0 ? String(v) : '')} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Products per region" description="Products developed, and how many of them were commercialized.">
        <ChartContainer config={productsConfig} className="h-72 w-full">
          <BarChart data={regions} margin={{ top: 20, right: 4, left: -20, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="code" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={11} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} fontSize={11} />
            <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent labelFormatter={fullName} />} />
            <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
            <Bar dataKey="products_developed" fill="var(--color-products_developed)" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="products_commercialized" fill="var(--color-products_commercialized)" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ChartContainer>
      </ChartCard>
    </div>
  )
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-0.5 mb-4 text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  )
}
