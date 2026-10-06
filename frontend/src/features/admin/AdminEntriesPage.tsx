import { ChevronLeft, ChevronRight, FileSpreadsheet, LoaderCircle, Search, SearchX, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadReport, FILTER_KEYS, useAdminEntries, type AdminEntry, type EntryFilters, type EntryTotals } from '@/features/admin/api'
import { useRegions } from '@/features/entries/api'
import { ASSISTANCE_TYPES, ENTRY_FIELD_KEYS, ENTRY_FIELDS, LTO_STATUSES, shortLabel } from '@/features/entries/fields'
import { formatField } from '@/features/entries/format'
import { LtoBadge } from '@/features/entries/LtoBadge'
import { errorMessage } from '@/lib/api'
import { formatExact } from '@/lib/time'
import { useDocumentTitle } from '@/lib/use-document-title'

/** Every field from fields.ts, except ones rendered inside another (the "Other" text). Name is pinned first. */
const COLUMNS = ENTRY_FIELD_KEYS.filter((key) => key !== 'name' && ENTRY_FIELDS[key].input.kind !== 'checkboxes-other')

/** Free text and multi-select values need room, or rows turn into tall towers. */
const WIDE_KINDS = new Set(['textarea', 'checkboxes'])

const ALL = 'all' // Radix Select can't use "" as an item value
const numberFormat = new Intl.NumberFormat('en-PH')

export function AdminEntriesPage() {
  useDocumentTitle('All Entries')
  const [params, setParams] = useSearchParams()
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) ?? ''])) as EntryFilters
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [searchText, setSearchText] = useState(filters.search)
  const [downloading, setDownloading] = useState(false)

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useAdminEntries(filters, page)

  /** Changing any filter goes back to page 1. */
  const setFilter = (key: keyof EntryFilters, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next, { replace: true })
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (searchText.trim() !== filters.search) setFilter('search', searchText.trim())
    }, 300)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [searchText])

  useEffect(() => {
    if (isError) toast.error(`Couldn't load the entries. ${errorMessage(error)}`, { id: 'admin-entries-error' })
  }, [isError, error])

  const hasFilters = FILTER_KEYS.some((key) => filters[key])

  const goToPage = (next: number) => {
    const nextParams = new URLSearchParams(params)
    nextParams.set('page', String(next))
    setParams(nextParams)
  }

  const download = async () => {
    setDownloading(true)
    try {
      await downloadReport(filters)
      toast.success('Report downloaded.')
    } catch (e) {
      toast.error(`Couldn't generate the report. ${errorMessage(e)}`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Page
      title="All Entries"
      className="max-w-[1400px]"
      actions={
        <Button onClick={download} disabled={downloading || data?.meta.total === 0}>
          {downloading ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <FileSpreadsheet data-icon="inline-start" />}
          {downloading ? 'Preparing...' : 'Download Excel'}
        </Button>
      }
    >
      <p className="-mt-6 mb-6 max-w-[65ch] text-sm text-muted-foreground">
        Every FIC entry from every member. The Excel report uses the filters below.
      </p>

      <Filters
        filters={filters}
        searchText={searchText}
        onSearchText={setSearchText}
        onChange={setFilter}
        onClear={hasFilters ? () => { setSearchText(''); setParams({}, { replace: true }) } : undefined}
      />

      {filters.user && (
        <p className="mb-4 inline-flex items-center gap-1 rounded-md bg-accent py-1 pr-1 pl-2.5 text-sm text-accent-foreground">
          Submitted by {data?.data[0]?.owner.name ?? 'one member'}
          <Button variant="ghost" size="icon-xs" aria-label="Show entries from everyone" onClick={() => setFilter('user', '')}>
            <X />
          </Button>
        </p>
      )}

      {isPending ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} className="py-16" />
      ) : (
        <>
          <Totals totals={data.totals} />
          {data.data.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={hasFilters ? 'No entries match these filters' : 'No entries yet'}
              description={hasFilters ? 'Try removing a filter or widening the date range.' : 'Entries appear here as members add them.'}
              className="py-10"
            />
          ) : (
            <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
              <EntriesTable entries={data.data} />
              {data.meta.last_page > 1 && (
                <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {data.meta.from}-{data.meta.to} of {numberFormat.format(data.meta.total)}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                      <ChevronLeft data-icon="inline-start" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.meta.last_page}
                      onClick={() => goToPage(page + 1)}
                    >
                      Next
                      <ChevronRight data-icon="inline-end" />
                    </Button>
                  </div>
                </nav>
              )}
            </div>
          )}
        </>
      )}
    </Page>
  )
}

type FiltersProps = {
  filters: EntryFilters
  searchText: string
  onSearchText: (value: string) => void
  onChange: (key: keyof EntryFilters, value: string) => void
  onClear?: () => void
}

function Filters({ filters, searchText, onSearchText, onChange, onClear }: FiltersProps) {
  const regions = useRegions()

  return (
    <section aria-label="Filters" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto_auto]">
      <div className="grid gap-1.5 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="filter-search">Search</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="filter-search"
            type="search"
            value={searchText}
            onChange={(e) => onSearchText(e.target.value)}
            placeholder="FIC, institution or member"
            className="pl-8"
          />
        </div>
      </div>

      <FilterSelect
        id="filter-region"
        label="Region"
        value={filters.region}
        allLabel="All regions"
        options={regions.data?.map((r) => ({ value: r.code, label: r.name })) ?? []}
        onChange={(v) => onChange('region', v)}
      />
      <FilterSelect id="filter-lto" label="LTO status" value={filters.lto_status} allLabel="Any LTO status" options={LTO_STATUSES} onChange={(v) => onChange('lto_status', v)} />
      <FilterSelect
        id="filter-assistance"
        label="Assistance requested"
        value={filters.assistance_type}
        allLabel="Any assistance"
        options={ASSISTANCE_TYPES}
        onChange={(v) => onChange('assistance_type', v)}
      />

      <fieldset className="grid gap-1.5 sm:col-span-2 lg:col-span-1">
        <legend className="mb-1.5 text-sm leading-none font-medium">Submitted</legend>
        <div className="flex items-center gap-2">
          <Input type="date" aria-label="Submitted from" value={filters.from} max={filters.to || undefined} onChange={(e) => onChange('from', e.target.value)} className="w-[9.5rem]" />
          <span className="text-sm text-muted-foreground">to</span>
          <Input type="date" aria-label="Submitted to" value={filters.to} min={filters.from || undefined} onChange={(e) => onChange('to', e.target.value)} className="w-[9.5rem]" />
        </div>
      </fieldset>

      <div className="flex items-end">
        {onClear && (
          <Button variant="ghost" onClick={onClear}>
            <X data-icon="inline-start" />
            Clear filters
          </Button>
        )}
      </div>
    </section>
  )
}

type FilterSelectProps = {
  id: string
  label: string
  value: string
  allLabel: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
}

function FilterSelect({ id, label, value, allLabel, options, onChange }: FilterSelectProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const TOTALS: { key: keyof EntryTotals; label: string }[] = [
  { key: 'entries', label: 'Entries' },
  { key: 'products_developed', label: 'Products developed' },
  { key: 'products_commercialized', label: 'Products commercialized' },
  { key: 'msmes_served', label: 'MSMEs served' },
  { key: 'msmes_needing_tech_interventions', label: 'MSMEs needing tech interventions' },
]

function Totals({ totals }: { totals: EntryTotals }) {
  return (
    <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y py-4 sm:grid-cols-3 lg:grid-cols-5">
      {TOTALS.map(({ key, label }) => (
        <div key={key}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">{numberFormat.format(totals[key])}</dd>
        </div>
      ))}
    </dl>
  )
}

function EntriesTable({ entries }: { entries: AdminEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="sticky left-0 z-10 min-w-56 bg-muted pl-4">{ENTRY_FIELDS.name.label}</TableHead>
            <TableHead className="min-w-48">Submitted by</TableHead>
            {COLUMNS.map((key) => (
              <TableHead key={key} className={`whitespace-normal ${WIDE_KINDS.has(ENTRY_FIELDS[key].input.kind) ? 'min-w-80' : 'min-w-32'}`}>
                {shortLabel(key)}
              </TableHead>
            ))}
            <TableHead className="min-w-36 pr-4">Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="group [&>td]:align-top">
              <TableCell className="sticky left-0 z-10 max-w-64 bg-background pl-4 font-medium whitespace-normal group-hover:bg-muted">
                {entry.name}
              </TableCell>
              <TableCell className="whitespace-normal">
                <span className="block">{entry.owner.name}</span>
                <span className="block text-muted-foreground">{entry.owner.email}</span>
              </TableCell>
              {COLUMNS.map((key) => (
                <TableCell key={key} className="whitespace-normal text-muted-foreground tabular-nums">
                  {key === 'lto_status' ? <LtoBadge status={entry.lto_status} /> : formatField(entry, key)}
                </TableCell>
              ))}
              <TableCell className="pr-4 text-muted-foreground">{formatExact(entry.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading entries">
      <div className="mb-3 grid grid-cols-2 gap-6 border-y py-4 sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="grid gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
