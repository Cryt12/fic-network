import { ChevronLeft, ChevronRight, MapPinPlus, Pencil, Search, SearchX, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Page } from '@/components/Page'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDeleteEntry, useMyEntries, type FicEntry } from '@/features/entries/api'
import { ENTRY_FIELDS, fieldsShownIn, shortLabel } from '@/features/entries/fields'
import { LtoBadge } from '@/features/entries/LtoBadge'
import { formatField } from '@/features/entries/format'
import { errorMessage } from '@/lib/api'
import { formatRelative } from '@/lib/time'
import { useDocumentTitle } from '@/lib/use-document-title'

/** Table columns come from fields.ts (showIn.table); name is the first, linked column. */
const COLUMNS = fieldsShownIn('table').filter((key) => key !== 'name')

export function MyEntriesPage() {
  useDocumentTitle('My Entries')
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const search = params.get('search') ?? ''
  const [searchText, setSearchText] = useState(search)
  const [toDelete, setToDelete] = useState<FicEntry | null>(null)

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useMyEntries(page, search)

  // Debounce typing into the URL (which drives the query).
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (searchText.trim() === search) return
      setParams(searchText.trim() ? { search: searchText.trim() } : {}, { replace: true })
    }, 300)
    return () => window.clearTimeout(id)
  }, [searchText, search, setParams])

  useEffect(() => {
    if (isError) toast.error(`Couldn't load your entries. ${errorMessage(error)}`, { id: 'my-entries-error' })
  }, [isError, error])

  const goToPage = (next: number) => setParams({ ...(search && { search }), page: String(next) })

  return (
    <Page
      title="My Entries"
      actions={
        <Button asChild>
          <Link to="/entries/new">
            <MapPinPlus data-icon="inline-start" />
            Add New Entry
          </Link>
        </Button>
      }
    >
      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by FIC or host institution"
          aria-label="Search your entries"
          className="pl-8"
        />
      </div>

      {isPending ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} className="py-16" />
      ) : data.data.length === 0 ? (
        search ? (
          <EmptyState icon={SearchX} title="No matches" description={`None of your entries match "${search}".`} className="py-8" />
        ) : (
          <EmptyState
            icon={MapPinPlus}
            title="No entries yet"
            description="Add your Food Innovation Center and it will appear as a pin on the network map."
            className="py-8"
            action={
              <Button asChild>
                <Link to="/entries/new">Add New Entry</Link>
              </Button>
            }
          />
        )
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <EntriesTable entries={data.data} onDelete={setToDelete} />
          <EntriesCards entries={data.data} onDelete={setToDelete} />

          {data.meta.last_page > 1 && (
            <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground tabular-nums">
                {data.meta.from}-{data.meta.to} of {data.meta.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                  <ChevronLeft data-icon="inline-start" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= data.meta.last_page} onClick={() => goToPage(page + 1)}>
                  Next
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </div>
            </nav>
          )}
        </div>
      )}

      <DeleteEntryDialog entry={toDelete} onClose={() => setToDelete(null)} />
    </Page>
  )
}

type ListProps = { entries: FicEntry[]; onDelete: (entry: FicEntry) => void }

function EntriesTable({ entries, onDelete }: ListProps) {
  return (
    <div className="hidden overflow-hidden rounded-lg border md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="pl-4">{ENTRY_FIELDS.name.label}</TableHead>
            {COLUMNS.map((key) => (
              <TableHead key={key} className="whitespace-normal">
                {shortLabel(key)}
              </TableHead>
            ))}
            <TableHead>Updated</TableHead>
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="max-w-56 pl-4 font-medium whitespace-normal">{entry.name}</TableCell>
              {COLUMNS.map((key) => (
                <TableCell key={key} className="max-w-56 whitespace-normal text-muted-foreground tabular-nums">
                  {key === 'lto_status' ? <LtoBadge status={entry.lto_status} /> : formatField(entry, key)}
                </TableCell>
              ))}
              <TableCell className="text-muted-foreground">{formatRelative(entry.updated_at)}</TableCell>
              <TableCell className="pr-4">
                <RowActions entry={entry} onDelete={onDelete} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function EntriesCards({ entries, onDelete }: ListProps) {
  return (
    <ul className="flex flex-col divide-y rounded-lg border md:hidden">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">{entry.name}</p>
            <LtoBadge status={entry.lto_status} className="shrink-0" />
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            {COLUMNS.filter((key) => key !== 'lto_status').map((key) => (
              <div key={key} className="contents">
                <dt className="text-muted-foreground">{shortLabel(key)}</dt>
                <dd className="tabular-nums">{formatField(entry, key)}</dd>
              </div>
            ))}
          </dl>
          <RowActions entry={entry} onDelete={onDelete} className="justify-start" />
        </li>
      ))}
    </ul>
  )
}

function RowActions({ entry, onDelete, className }: { entry: FicEntry; onDelete: (e: FicEntry) => void; className?: string }) {
  return (
    <div className={`flex justify-end gap-1 ${className ?? ''}`}>
      <Button asChild variant="ghost" size="sm">
        <Link to={`/entries/${entry.id}/edit`} aria-label={`Edit ${entry.name}`}>
          <Pencil data-icon="inline-start" />
          Edit
        </Link>
      </Button>
      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(entry)} aria-label={`Delete ${entry.name}`}>
        <Trash2 data-icon="inline-start" />
        Delete
      </Button>
    </div>
  )
}

function DeleteEntryDialog({ entry, onClose }: { entry: FicEntry | null; onClose: () => void }) {
  const remove = useDeleteEntry()

  const confirm = async () => {
    if (!entry) return
    try {
      await remove.mutateAsync(entry.id)
      toast.success(`${entry.name} was deleted.`)
      onClose()
    } catch (error) {
      toast.error(`Couldn't delete the entry. ${errorMessage(error)}`)
    }
  }

  return (
    <AlertDialog open={entry !== null} onOpenChange={(open) => !open && !remove.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
          <AlertDialogDescription>
            {entry?.name} will be removed from your entries and from the map.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={(event) => {
              event.preventDefault() // keep the dialog open until the request finishes
              void confirm()
            }}
          >
            {remove.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4" aria-busy="true" aria-label="Loading entries">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-40 md:block" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-7 w-28" />
        </div>
      ))}
    </div>
  )
}
