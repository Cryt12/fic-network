import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import type { RegionSummary, Summary } from '@/features/summary/api'
import { ASSOCIATE, FULLTIME, number } from '@/features/summary/chart-style'
import { ChartCard, ScrollX } from '@/features/summary/RegionCharts'
import { cn } from '@/lib/utils'

const config = {
  fulltime_personnel: { label: 'Full-time (stationed in the FIC)', color: FULLTIME },
  associate_personnel: { label: 'Associate (not full-time in the FIC)', color: ASSOCIATE },
} satisfies ChartConfig

type Row = RegionSummary & { total: number }

/** Stack order, bottom to top. */
const SEGMENTS = ['fulltime_personnel', 'associate_personnel'] as const

/** Heading: the full region name, its total and how many of its FICs reported. */
const regionLabel = (_: unknown, payload: readonly { payload?: Row }[]) => {
  const r = payload[0]?.payload
  if (!r) return ''
  return (
    <span>
      {r.name}{' '}
      <span className="font-normal text-muted-foreground">
        · {number.format(r.total)} personnel, from {r.personnel_reported} of {r.fics} FIC{r.fics === 1 ? '' : 's'}
      </span>
    </span>
  )
}

/** FIC personnel per region as stacked columns: full-time and associate. */
export function PersonnelChart({ summary, isPending, className }: { summary: Summary | undefined; isPending: boolean; className?: string }) {
  if (isPending || !summary) {
    return (
      <div className={cn('rounded-lg border bg-card p-4', className)} aria-busy="true" aria-label="Loading chart">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-4 h-64" />
      </div>
    )
  }

  const { fulltime_personnel: fulltime, associate_personnel: associate, personnel_reported: reported, fics } = summary.national
  const data: Row[] = summary.regions.map((r) => ({ ...r, total: r.fulltime_personnel + r.associate_personnel }))
  const description =
    reported > 0
      ? `${number.format(fulltime)} full-time and ${number.format(associate)} associate personnel, from ${reported} of ${fics} FICs.` +
        (reported < fics ? ' The others will count once they update their entry.' : '')
      : 'Full-time and associate personnel of the FICs in each region.'

  return (
    <div className={className}>
      <ChartCard title="FIC personnel per region" description={description}>
        {reported === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No FIC has reported its personnel yet. FICs add it under FIC personnel when they add or edit their entry.
          </p>
        ) : (
          <ScrollX>
            <ChartContainer config={config} className="h-80 w-full min-w-[520px]">
              <BarChart data={data} margin={{ top: 20, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="code" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} fontSize={11} />
                <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent className="min-w-56" labelFormatter={regionLabel} />} />
                <ChartLegend
                  content={<ChartLegendContent className="flex-wrap" />}
                  verticalAlign="top"
                  itemSorter={(item) => SEGMENTS.indexOf(item.dataKey as (typeof SEGMENTS)[number])}
                />
                {SEGMENTS.map((key) => (
                  <Bar key={key} dataKey={key} stackId="personnel" fill={`var(--color-${key})`} maxBarSize={36}>
                    {/* The column total, drawn once above its topmost non-empty segment (Recharts skips empty ones). */}
                    <LabelList
                      valueAccessor={(entry: { payload?: Row }) => entry.payload?.code ?? ''}
                      content={(props) => {
                        const row = data.find((r) => r.code === props.value)
                        if (!row || SEGMENTS.findLast((k) => row[k] > 0) !== key) return null
                        return (
                          <text x={Number(props.x) + Number(props.width) / 2} y={Number(props.y) - 6} textAnchor="middle" fontSize={11} className="fill-foreground">
                            {number.format(row.total)}
                          </text>
                        )
                      }}
                    />
                  </Bar>
                ))}
              </BarChart>
            </ChartContainer>
          </ScrollX>
        )}
      </ChartCard>
    </div>
  )
}
