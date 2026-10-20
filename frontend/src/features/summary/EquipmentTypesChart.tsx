import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { EquipmentTypeSummary, Summary } from '@/features/summary/api'
import { number } from '@/features/summary/chart-style'
import { equipmentConfig, OPTIONS, type View } from '@/features/summary/equipment-style'
import { ChartCard } from '@/features/summary/RegionCharts'
import { cn } from '@/lib/utils'

/** Beyond this many types, the rarest are added up into one "Other equipment" row. */
const MAX_ROWS = 15

const OTHER = 'Other equipment'

/** The most listed types first; the long tail of one-off custom equipment becomes one row. */
function rowsFor(types: EquipmentTypeSummary[]): EquipmentTypeSummary[] {
  if (types.length <= MAX_ROWS) return types
  const shown = types.slice(0, MAX_ROWS - 1)
  const rest = types.slice(MAX_ROWS - 1)
  const sum = (view: View) =>
    Object.fromEntries(OPTIONS[view].map((o) => [o.value, rest.reduce((n, t) => n + (t[view][o.value] ?? 0), 0)]))
  return [
    ...shown,
    { name: `${OTHER} (${rest.length} types)`, total: rest.reduce((n, t) => n + t.total, 0), operation: sum('operation'), utilization: sum('utilization') },
  ]
}

const DESCRIPTION: Record<View, string> = {
  utilization: 'how often each type is used',
  operation: 'the operation status of each type',
}

/** Nationwide, per equipment type (Spray dryer, Oven, ...): units by utilization, or by operation status. */
export function EquipmentTypesChart({ summary, isPending, className }: { summary: Summary | undefined; isPending: boolean; className?: string }) {
  const [view, setView] = useState<View>('utilization')

  if (isPending || !summary) {
    return (
      <div className={cn('rounded-lg border bg-card p-4', className)} aria-busy="true" aria-label="Loading chart">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-4 h-72" />
      </div>
    )
  }

  const types = summary.equipment_types
  const units = types.reduce((n, t) => n + t.total, 0)
  const description =
    units > 0
      ? `${number.format(units)} units of ${types.length} equipment types listed by FICs nationwide, by ${DESCRIPTION[view]}.`
      : 'Equipment listed by FICs nationwide, by type.'

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as View)} className={cn('gap-0', className)}>
      <ChartCard
        title="Equipment utilization nationwide"
        description={description}
        action={
          <TabsList className="shrink-0">
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="operation">Operation status</TabsTrigger>
          </TabsList>
        }
      >
        {units === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No equipment listed yet. FICs can add theirs under FIC equipment when they edit their entry.
          </p>
        ) : (
          (['utilization', 'operation'] as const).map((v) => (
            <TabsContent key={v} value={v}>
              <TypeBars rows={rowsFor(types)} view={v} />
            </TabsContent>
          ))
        )}
      </ChartCard>
    </Tabs>
  )
}

function TypeBars({ rows, view }: { rows: EquipmentTypeSummary[]; view: View }) {
  const options = OPTIONS[view]
  const data = rows.map((t) => ({ name: t.name, total: t.total, ...t[view] }))

  return (
    <ChartContainer config={equipmentConfig(view)} className="w-full" style={{ height: rows.length * 34 + 72 }}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} interval={0} width={150} fontSize={12} />
        <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent />} />
        {/* Legend in stack order (left to right), not Recharts' default alphabetical order. */}
        <ChartLegend
          content={<ChartLegendContent className="flex-wrap" />}
          verticalAlign="top"
          itemSorter={(item) => options.findIndex((o) => o.value === item.dataKey)}
        />
        {options.map((o) => (
          <Bar key={o.value} dataKey={o.value} stackId="status" fill={`var(--color-${o.value})`} maxBarSize={20}>
            {/* Each row's total, drawn once, after its last non-empty segment. */}
            <LabelList
              // The label's value is the type name (Recharts' index skips empty segments).
              valueAccessor={(entry: { payload?: { name?: string } }) => entry.payload?.name ?? ''}
              content={(props) => {
                const row = data.find((r) => r.name === props.value)
                const last = row && options.findLast((opt) => (row[opt.value as keyof typeof row] as number) > 0)
                if (!row || last?.value !== o.value) return null
                return (
                  <text
                    x={Number(props.x) + Number(props.width) + 6}
                    y={Number(props.y) + Number(props.height) / 2}
                    dominantBaseline="central"
                    fontSize={11}
                    className="fill-foreground"
                  >
                    {row.total}
                  </text>
                )
              }}
            />
          </Bar>
        ))}
      </BarChart>
    </ChartContainer>
  )
}
