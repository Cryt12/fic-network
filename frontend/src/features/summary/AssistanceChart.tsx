import { useState, useSyncExternalStore } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { AssistanceSummary, RegionSummary, Summary } from '@/features/summary/api'
import { DEVELOPED, percent } from '@/features/summary/chart-style'
import { ChartCard } from '@/features/summary/RegionCharts'
import { cn } from '@/lib/utils'

const config = {
  fics: { label: 'FICs', color: DEVELOPED },
} satisfies ChartConfig

const WIDE = '(min-width: 640px)'
const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(WIDE)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
const useWide = () => useSyncExternalStore(subscribe, () => window.matchMedia(WIDE).matches)

/** Phones get the short half of each label ("Packaging / Labeling" -> "Packaging"); tooltips keep the full one. */
const shortLabel = (label: string) => label.split(' / ')[0]

/** Most requested first; "Other" stays last. */
function ranked(assistance: AssistanceSummary[]): AssistanceSummary[] {
  return [...assistance].sort((a, b) => Number(a.type === 'other') - Number(b.type === 'other') || b.fics - a.fics)
}

type View = 'regions' | 'national'

const DESCRIPTIONS: Record<View, string> = {
  regions: "FICs in each region whose MSMEs requested each type of assistance. Darker cells are a larger share of the region's FICs.",
  national: 'Number of FICs whose MSMEs requested each type of assistance, out of all FICs.',
}

/** Assistance requested by MSMEs: a region-by-type grid, or nationwide bars. */
export function AssistanceChart({ summary, isPending, className }: { summary: Summary | undefined; isPending: boolean; className?: string }) {
  const wide = useWide()
  const [view, setView] = useState<View>('regions')

  if (isPending || !summary) {
    return (
      <div className={cn('rounded-lg border bg-card p-4', className)} aria-busy="true" aria-label="Loading chart">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-4 h-80" />
      </div>
    )
  }

  const types = ranked(summary.assistance)

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as View)} className={cn('gap-0', className)}>
      <ChartCard
        title="Assistance requested by MSMEs"
        description={DESCRIPTIONS[view]}
        action={
          <TabsList className="shrink-0">
            <TabsTrigger value="regions">By region</TabsTrigger>
            <TabsTrigger value="national">Nationwide</TabsTrigger>
          </TabsList>
        }
      >
        <TabsContent value="regions">
          <RegionGrid regions={summary.regions} types={types} total={summary.national.fics} wide={wide} />
        </TabsContent>
        <TabsContent value="national">
          <NationalBars types={types} total={summary.national.fics} wide={wide} />
        </TabsContent>
      </ChartCard>
    </Tabs>
  )
}

const fullLabel = (_: unknown, payload: readonly { payload?: AssistanceSummary }[]) => payload[0]?.payload?.label ?? ''

/** Horizontal bars: how many FICs nationwide report MSMEs requesting each type. */
function NationalBars({ types, total, wide }: { types: AssistanceSummary[]; total: number; wide: boolean }) {
  const data = types.map((item) => ({ ...item, axisLabel: wide ? item.label : shortLabel(item.label) }))

  return (
    <ChartContainer config={config} className="h-[420px] w-full">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 80, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" allowDecimals={false} domain={[0, Math.max(1, total)]} tickLine={false} axisLine={false} fontSize={11} />
        <YAxis type="category" dataKey="axisLabel" tickLine={false} axisLine={false} interval={0} width={wide ? 320 : 112} fontSize={12} />
        <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent labelFormatter={fullLabel} />} />
        <Bar dataKey="fics" fill="var(--color-fics)" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {/* "18 (75%)" after each bar: the count and its share of all FICs. */}
          <LabelList
            dataKey="fics"
            position="right"
            fontSize={11}
            className="fill-foreground"
            formatter={(v: unknown) => (total > 0 ? `${Number(v)} (${percent.format(Number(v) / total)})` : '0')}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/** Cell shade: a light tint for one FIC, full green when every FIC in the column asked for it. */
const shade = (share: number) => `color-mix(in oklab, ${DEVELOPED} ${Math.round(12 + share * 88)}%, var(--card))`

/**
 * Every region side by side (official order, like the charts above): one row per assistance type,
 * each cell the number of the region's FICs whose MSMEs requested it. The last column is nationwide.
 */
function RegionGrid({ regions, types, total, wide }: { regions: RegionSummary[]; types: AssistanceSummary[]; total: number; wide: boolean }) {
  const columns = [
    ...regions.map((r) => ({ code: r.code, name: r.name, fics: r.fics, count: (type: string) => r.assistance[type] ?? 0 })),
    {
      code: 'All',
      name: 'All regions',
      fics: total,
      count: (type: string) => types.find((t) => t.type === type)?.fics ?? 0,
    },
  ]
  const isTotal = (code: string) => code === 'All'

  return (
    <div>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <table className="w-full min-w-[760px] border-separate border-spacing-0.5 text-sm tabular-nums">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-card pr-3 text-left text-xs font-medium text-muted-foreground">
                Assistance type
              </th>
              {columns.map((c) => (
                <th key={c.code} scope="col" className={cn('min-w-8 px-0.5 pb-1 text-xs font-medium', isTotal(c.code) ? 'pl-2 text-foreground' : 'text-muted-foreground')}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-default">{c.code}</span>
                    </TooltipTrigger>
                    <TooltipContent>{c.name}</TooltipContent>
                  </Tooltip>
                </th>
              ))}
            </tr>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-card pr-3 pb-1 text-left text-xs font-normal text-muted-foreground">
                FICs in the region
              </th>
              {columns.map((c) => (
                <td key={c.code} className={cn('pb-1 text-center text-xs text-muted-foreground', isTotal(c.code) && 'pl-2 font-medium text-foreground')}>
                  {c.fics}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.type}>
                <th scope="row" className="sticky left-0 z-10 bg-card pr-3 text-left text-[13px] font-normal whitespace-nowrap text-muted-foreground">
                  {wide ? t.label : shortLabel(t.label)}
                </th>
                {columns.map((c) => (
                  <td key={c.code} className={cn('p-0', isTotal(c.code) && 'pl-2')}>
                    <Cell label={t.label} region={c.name} count={c.count(t.type)} fics={c.fics} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          Share of the region's FICs
          <span className="h-2.5 w-28 rounded-sm" style={{ background: `linear-gradient(to right, ${shade(0)}, ${shade(1)})` }} aria-hidden />
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex size-4 items-center justify-center rounded-sm bg-muted text-[10px]" aria-hidden>
            0
          </span>
          None requested
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex size-4 items-center justify-center text-[11px]" aria-hidden>
            –
          </span>
          No FICs yet
        </span>
      </div>
    </div>
  )
}

function Cell({ label, region, count, fics }: { label: string; region: string; count: number; fics: number }) {
  if (fics === 0) {
    return (
      <span className="flex h-8 items-center justify-center text-muted-foreground/60" aria-label="No FICs yet">
        –
      </span>
    )
  }

  const share = count / fics
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'flex h-8 cursor-default items-center justify-center rounded-sm text-xs font-medium',
            count === 0 ? 'bg-muted text-muted-foreground' : share >= 0.5 ? 'text-white' : 'text-foreground',
          )}
          style={count > 0 ? { background: shade(share) } : undefined}
        >
          {count}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{region}</span>
          <span>{label}</span>
          <span>
            {count} of {fics} FIC{fics === 1 ? '' : 's'} ({percent.format(share)})
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
