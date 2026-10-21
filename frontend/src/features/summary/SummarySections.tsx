import type { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EQUIPMENT_OPERATION, EQUIPMENT_UTILIZATION } from '@/features/entries/fields'
import type { Summary } from '@/features/summary/api'
import { Bar, LegendItem } from '@/features/summary/chart'
import { ASSOCIATE, COMMERCIALIZED, DEVELOPED, FULLTIME, number, percent, shortRegion } from '@/features/summary/chart-style'
import { COLORS } from '@/features/summary/equipment-style'
import { cn } from '@/lib/utils'

/*
 * The Dashboard's other charts as Summary-page sections: bar lists you can read at a glance,
 * and full tables with every number (the same data as the Dashboard data Excel).
 */

export function SectionHeading({ id, title, description, legend }: { id: string; title: string; description?: string; legend?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <div>
        <h2 id={id} className="text-base font-semibold tracking-tight">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {legend && (
        <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Legend">
          {legend}
        </ul>
      )}
    </div>
  )
}

function BarRow({ label, fullLabel, labelWidth = 'narrow', children }: { label: string; fullLabel: string; labelWidth?: 'narrow' | 'wide'; children: ReactNode }) {
  return (
    <li
      className={cn(
        'grid items-center gap-3',
        labelWidth === 'wide' ? 'grid-cols-[9rem_minmax(0,1fr)] sm:grid-cols-[16rem_minmax(0,1fr)]' : 'grid-cols-[7.5rem_minmax(0,1fr)] sm:grid-cols-[9rem_minmax(0,1fr)]',
      )}
    >
      <span className="truncate text-right text-sm text-muted-foreground" title={fullLabel}>
        {label}
      </span>
      {children}
    </li>
  )
}

/** Food MSME partners reported by DOST FIC Focal accounts, per region, with how many hold an LTO. */
export function MsmePartnersByRegion({ summary }: { summary: Summary }) {
  const rows = summary.regions.filter((r) => r.msme_partners > 0).sort((a, b) => b.msme_partners - a.msme_partners)
  const max = Math.max(1, ...rows.map((r) => r.msme_partners))
  const { msme_partners: partners, msmes_with_lto: withLto } = summary.national

  return (
    <section aria-labelledby="msme-partners">
      <SectionHeading
        id="msme-partners"
        title="Food MSME partners per region"
        description={
          partners > 0
            ? `${number.format(partners)} partners nationwide, ${number.format(withLto)} with LTO (${percent.format(withLto / partners)}). Reported by DOST FIC Focal accounts.`
            : 'Reported by DOST FIC Focal accounts.'
        }
        legend={
          <>
            <LegendItem color={DEVELOPED} label="Partners" />
            <LegendItem color={COMMERCIALIZED} label="With LTO" />
          </>
        }
      />
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No Food MSME partners reported yet.</p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {rows.map((region) => (
            <BarRow key={region.code} label={shortRegion(region.name)} fullLabel={region.name}>
              <div className="flex flex-col gap-0.5">
                <Bar value={region.msme_partners} max={max} color={DEVELOPED} tooltip={`${region.name}: ${number.format(region.msme_partners)} Food MSME partners`} />
                <Bar
                  value={region.msmes_with_lto}
                  max={max}
                  color={COMMERCIALIZED}
                  tooltip={`${region.name}: ${number.format(region.msmes_with_lto)} with LTO (${percent.format(region.msmes_with_lto / region.msme_partners)})`}
                />
              </div>
            </BarRow>
          ))}
        </ul>
      )}
    </section>
  )
}

/** FIC personnel per region: full-time (stationed in the FIC) and associate. */
export function PersonnelByRegion({ summary }: { summary: Summary }) {
  const rows = summary.regions
    .filter((r) => r.personnel_reported > 0)
    .sort((a, b) => b.fulltime_personnel + b.associate_personnel - (a.fulltime_personnel + a.associate_personnel))
  const max = Math.max(1, ...rows.flatMap((r) => [r.fulltime_personnel, r.associate_personnel]))
  const { fulltime_personnel: fulltime, associate_personnel: associate, personnel_reported: reported, fics } = summary.national

  return (
    <section aria-labelledby="personnel">
      <SectionHeading
        id="personnel"
        title="FIC personnel per region"
        description={
          reported > 0
            ? `${number.format(fulltime)} full-time and ${number.format(associate)} associate personnel, from ${reported} of ${fics} FICs.`
            : 'Full-time personnel are stationed in the FIC; associate personnel do not report full-time.'
        }
        legend={
          <>
            <LegendItem color={FULLTIME} label="Full-time" />
            <LegendItem color={ASSOCIATE} label="Associate" />
          </>
        }
      />
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No FIC has reported its personnel yet. FICs add it when they add or edit their entry.</p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {rows.map((region) => (
            <BarRow key={region.code} label={shortRegion(region.name)} fullLabel={region.name}>
              <div className="flex flex-col gap-0.5">
                <Bar value={region.fulltime_personnel} max={max} color={FULLTIME} tooltip={`${region.name}: ${number.format(region.fulltime_personnel)} full-time personnel`} />
                <Bar
                  value={region.associate_personnel}
                  max={max}
                  color={ASSOCIATE}
                  tooltip={`${region.name}: ${number.format(region.associate_personnel)} associate personnel (from ${region.personnel_reported} of ${region.fics} FICs)`}
                />
              </div>
            </BarRow>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Each assistance type nationwide: how many FICs report MSMEs requesting it. */
export function AssistanceNationwide({ summary }: { summary: Summary }) {
  const total = summary.national.fics
  const rows = [...summary.assistance].sort((a, b) => Number(a.type === 'other') - Number(b.type === 'other') || b.fics - a.fics)

  return (
    <section aria-labelledby="assistance-nationwide">
      <SectionHeading id="assistance-nationwide" title="Assistance requested by MSMEs" description={`FICs whose MSMEs requested each type, out of ${number.format(total)} FICs.`} />
      <ul className="flex flex-col gap-2.5">
        {rows.map((type) => (
          <BarRow key={type.type} label={type.label} fullLabel={type.label} labelWidth="wide">
            <Bar
              value={type.fics}
              max={Math.max(1, total)}
              color={DEVELOPED}
              tooltip={`${type.label}: ${type.fics} of ${total} FICs${total > 0 ? ` (${percent.format(type.fics / total)})` : ''}`}
            />
          </BarRow>
        ))}
      </ul>
    </section>
  )
}

type StatusCounts = { operation: Record<string, number>; utilization: Record<string, number> }

const GROUPS = [
  { key: 'utilization', title: 'Utilization', options: EQUIPMENT_UTILIZATION },
  { key: 'operation', title: 'Operation status', options: EQUIPMENT_OPERATION },
] as const

/** Two header rows: the group ("Utilization", "Operation status") over its statuses, each with its chart color. */
function StatusHeader({ first }: { first: string }) {
  return (
    <TableHeader>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableHead rowSpan={2} className="pl-4 align-bottom">
          {first}
        </TableHead>
        <TableHead rowSpan={2} className="text-right align-bottom">
          Units
        </TableHead>
        {GROUPS.map((g) => (
          <TableHead key={g.key} colSpan={g.options.length} className="h-8 border-l text-center">
            {g.title}
          </TableHead>
        ))}
      </TableRow>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        {GROUPS.flatMap((g) =>
          g.options.map((o, i) => (
            <TableHead key={`${g.key}-${o.value}`} className={cn('h-auto py-2 text-right align-bottom text-xs whitespace-normal', i === 0 && 'border-l')}>
              <span className="inline-flex items-start gap-1.5">
                <span className="mt-1 size-2 shrink-0 rounded-[2px]" style={{ background: COLORS[g.key][o.value] }} aria-hidden />
                {o.label}
              </span>
            </TableHead>
          )),
        )}
      </TableRow>
    </TableHeader>
  )
}

function StatusCells({ counts, units }: { counts: StatusCounts; units: number }) {
  return GROUPS.flatMap((g) =>
    g.options.map((o, i) => {
      const n = counts[g.key][o.value] ?? 0
      return (
        <TableCell key={`${g.key}-${o.value}`} className={cn('text-right tabular-nums', i === 0 && 'border-l', n === 0 && 'text-muted-foreground/60')}>
          {n}
          {n > 0 && units > 0 && <span className="ml-1 text-xs text-muted-foreground">({percent.format(n / units)})</span>}
        </TableCell>
      )
    }),
  )
}

function sumCounts(rows: StatusCounts[]): StatusCounts {
  const add = (key: keyof StatusCounts, options: readonly { value: string }[]) =>
    Object.fromEntries(options.map((o) => [o.value, rows.reduce((n, r) => n + (r[key][o.value] ?? 0), 0)]))
  return { operation: add('operation', EQUIPMENT_OPERATION), utilization: add('utilization', EQUIPMENT_UTILIZATION) }
}

/** Every equipment type listed nationwide, with units per utilization and operation status. */
export function EquipmentByType({ summary }: { summary: Summary }) {
  const types = summary.equipment_types
  const units = summary.national.equipment

  return (
    <section aria-labelledby="equipment-by-type">
      <SectionHeading
        id="equipment-by-type"
        title="FIC equipment by type"
        description={units > 0 ? `${number.format(units)} units of ${types.length} equipment types listed by FICs nationwide. Percentages are of each row's units.` : undefined}
      />
      {types.length === 0 ? (
        <p className="text-sm text-muted-foreground">No equipment listed yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <StatusHeader first="Equipment" />
            <TableBody>
              {types.map((t) => (
                <TableRow key={t.name}>
                  <TableCell className="pl-4 font-medium">{t.name}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{t.total}</TableCell>
                  <StatusCells counts={t} units={t.total} />
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell className="pl-4">All equipment</TableCell>
                <TableCell className="text-right tabular-nums">{number.format(units)}</TableCell>
                <StatusCells counts={sumCounts(types)} units={units} />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </section>
  )
}

/** Equipment per region, with units per utilization and operation status. */
export function EquipmentByRegion({ summary }: { summary: Summary }) {
  const rows = summary.regions
    .map((r) => ({ region: r, units: Object.values(r.equipment.operation).reduce((a, b) => a + b, 0) }))
    .filter((r) => r.units > 0)
  const none = summary.regions.filter((r) => r.fics > 0 && !rows.some((row) => row.region.code === r.code))

  if (rows.length === 0) return null

  return (
    <section aria-labelledby="equipment-by-region">
      <SectionHeading id="equipment-by-region" title="FIC equipment by region" description="Percentages are of each region's units." />
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <StatusHeader first="Region" />
          <TableBody>
            {rows.map(({ region, units }) => (
              <TableRow key={region.code}>
                <TableCell className="pl-4">{region.name}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{units}</TableCell>
                <StatusCells counts={region.equipment} units={units} />
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-semibold">
              <TableCell className="pl-4">Philippines (national)</TableCell>
              <TableCell className="text-right tabular-nums">{number.format(summary.national.equipment)}</TableCell>
              <StatusCells counts={sumCounts(rows.map((r) => r.region.equipment))} units={summary.national.equipment} />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      {none.length > 0 && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">FICs with no equipment listed yet:</span> {none.map((r) => shortRegion(r.name)).join(', ')}
        </p>
      )}
    </section>
  )
}
