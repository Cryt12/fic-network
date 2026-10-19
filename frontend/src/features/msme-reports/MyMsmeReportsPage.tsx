import { ChevronLeft, ChevronRight, FilePlus2, Pencil, Trash2, UsersRound } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDeleteMsmeReport, useMyMsmeReports, type MsmeReport, type RegionTotals } from '@/features/msme-reports/api'
import { number, percent } from '@/features/summary/chart-style'
import { errorMessage } from '@/lib/api'
import { formatExact, formatRelative } from '@/lib/time'
import { useDocumentTitle } from '@/lib/use-document-title'

/** A DOST FIC Focal's own Food MSME partner entries, with their region's running totals. */
export function MyMsmeReportsPage() {
  useDocumentTitle('My Entries')
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [toDelete, setToDelete] = useState<MsmeReport | null>(null)
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useMyMsmeReports(page)

  useEffect(() => {
    if (isError) toast.error(`Couldn't load your entries. ${errorMessage(error)}`, { id: 'my-msme-reports-error' })
  }, [isError, error])

  return (
    <Page
      title="My Entries"
      className="max-w-3xl"
      actions={
        <Button asChild>
          <Link to="/msme-reports/new">
            <FilePlus2 data-icon="inline-start" />
            Add New Entry
          </Link>
        </Button>
      }
    >
      {isPending ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} className="py-16" />
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <Totals totals={data.region_totals} />

          {data.data.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="No entries yet"
              description="Add the number of Food MSME partners in your region and how many of them have an LTO."
              className="py-8"
              action={
                <Button asChild>
                  <Link to="/msme-reports/new">Add New Entry</Link>
                </Button>
              }
            />
          ) : (
            <>
              <h2 className="mb-3 text-base font-semibold tracking-tight">Your entries</h2>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="pl-4">Added</TableHead>
                      <TableHead className="text-right">Food MSME partners</TableHead>
                      <TableHead className="text-right">With LTO</TableHead>
                      <TableHead className="pr-4 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="pl-4">
                          <span className="block">{formatExact(report.created_at)}</span>
                          <span className="block text-xs text-muted-foreground">{formatRelative(report.created_at)}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{number.format(report.msme_partners)}</TableCell>
                        <TableCell className="text-right tabular-nums">{number.format(report.msmes_with_lto)}</TableCell>
                        <TableCell className="pr-4">
                          <div className="flex justify-end gap-1">
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/msme-reports/${report.id}/edit`}>
                                <Pencil data-icon="inline-start" />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setToDelete(report)}
                            >
                              <Trash2 data-icon="inline-start" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data.meta.last_page > 1 && (
                <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {data.meta.from}-{data.meta.to} of {data.meta.total}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })}>
                      <ChevronLeft data-icon="inline-start" />
                      Newer
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= data.meta.last_page} onClick={() => setParams({ page: String(page + 1) })}>
                      Older
                      <ChevronRight data-icon="inline-end" />
                    </Button>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      )}

      <DeleteDialog report={toDelete} onClose={() => setToDelete(null)} />
    </Page>
  )
}

function Totals({ totals }: { totals: RegionTotals }) {
  const share = totals.msme_partners > 0 ? percent.format(totals.msmes_with_lto / totals.msme_partners) : null

  return (
    <section aria-labelledby="region-totals" className="mb-8">
      <h2 id="region-totals" className="text-sm text-muted-foreground">
        {totals.region_name} totals, all DOST FIC Focal entries
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-6 border-y py-4">
        <div>
          <dt className="text-sm text-muted-foreground">Food MSME partners</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{number.format(totals.msme_partners)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">MSMEs with LTO</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{number.format(totals.msmes_with_lto)}</dd>
          {share && <dd className="mt-0.5 text-xs text-muted-foreground">{share} of partners</dd>}
        </div>
      </dl>
    </section>
  )
}

function DeleteDialog({ report, onClose }: { report: MsmeReport | null; onClose: () => void }) {
  const remove = useDeleteMsmeReport()

  const confirm = async () => {
    if (!report) return
    try {
      await remove.mutateAsync(report.id)
      toast.success('Entry deleted.')
      onClose()
    } catch (error) {
      toast.error(`Couldn't delete the entry. ${errorMessage(error)}`)
    }
  }

  return (
    <AlertDialog open={report !== null} onOpenChange={(open) => !open && !remove.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
          <AlertDialogDescription>
            {report && `${number.format(report.msme_partners)} Food MSME partners (${number.format(report.msmes_with_lto)} with LTO)`} will be
            taken out of your region's totals.
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
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading entries">
      <Skeleton className="h-24 w-full" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
