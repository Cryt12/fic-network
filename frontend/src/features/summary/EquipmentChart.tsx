import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RegionSummary, Summary } from '@/features/summary/api'
import { equipmentConfig as configFor, OPTIONS, type View } from '@/features/summary/equipment-style'
import { ChartCard, ScrollX } from '@/features/summary/RegionCharts'
import { cn } from '@/lib/utils'

const DESCRIPTIONS: Record<View, string> = {
  operation: 'Equipment listed by the FICs in each region, by operation status.',
  utilization: 'Equipment listed by the FICs in each region, by how often it is used.',
}

/** Tooltips show the full region name; the axis uses the short code (NCR, CAR, I ... BARMM). */
const fullName = (_: unknown, payload: readonly { payload?: { name?: string } }[]) => payload[0]?.payload?.name ?? ''

/** FIC equipment per region as stacked columns: operation status, or utilization. */
export function EquipmentChart({ summary, isPending, className }: { summary: Summary | undefined; isPending: boolean; className?: string }) {
  const [view, setView] = useState<View>('operation')

  if (isPending || !summary) {
    return (
      <div className={cn('rounded-lg border bg-card p-4', className)} aria-busy="true" aria-label="Loading chart">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-4 h-64" />
      </div>
    )
  }

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as View)} className={cn('gap-0', className)}>
      <ChartCard
        title="FIC equipment status"
        description={DESCRIPTIONS[view]}
        action={
          <TabsList className="shrink-0">
            <TabsTrigger value="operation">Operation status</TabsTrigger>
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
          </TabsList>
        }
      >
        {summary.national.equipment === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No equipment listed yet. FICs can add theirs under FIC equipment when they edit their entry.
          </p>
        ) : (
          (['operation', 'utilization'] as const).map((v) => (
            <TabsContent key={v} value={v}>
              <StatusColumns regions={summary.regions} view={v} />
            </TabsContent>
          ))
        )}
      </ChartCard>
    </Tabs>
  )
}

function StatusColumns({ regions, view }: { regions: RegionSummary[]; view: View }) {
  const options = OPTIONS[view]
  const data = regions.map((r) => {
    const counts = r.equipment[view]
    return { code: r.code, name: r.name, ...counts, total: Object.values(counts).reduce((a, b) => a + b, 0) }
  })

  return (
    <ScrollX>
      <ChartContainer config={configFor(view)} className="h-80 w-full min-w-[520px]">
        <BarChart data={data} margin={{ top: 20, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="code" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={11} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} fontSize={11} />
          <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent labelFormatter={fullName} />} />
          {/* Legend in stack order (bottom to top), not Recharts' default alphabetical order. */}
          <ChartLegend
            content={<ChartLegendContent className="flex-wrap" />}
            verticalAlign="top"
            itemSorter={(item) => options.findIndex((o) => o.value === item.dataKey)}
          />
          {options.map((o) => (
            <Bar key={o.value} dataKey={o.value} stackId="status" fill={`var(--color-${o.value})`} maxBarSize={36}>
              {/* Each column's total, drawn once, above its topmost non-empty segment. */}
              <LabelList
                // The label's value is the region code (Recharts' index skips empty segments).
                valueAccessor={(entry: { payload?: { code?: string } }) => entry.payload?.code ?? ''}
                content={(props) => {
                  const row = data.find((r) => r.code === props.value)
                  const top = row && options.findLast((opt) => (row[opt.value as keyof typeof row] as number) > 0)
                  if (!row || top?.value !== o.value) return null
                  const x = Number(props.x) + Number(props.width) / 2
                  return (
                    <text x={x} y={Number(props.y) - 6} textAnchor="middle" fontSize={11} className="fill-foreground">
                      {row.total}
                    </text>
                  )
                }}
              />
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>
    </ScrollX>
  )
}
