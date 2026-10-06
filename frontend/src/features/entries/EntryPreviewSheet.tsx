import { Pencil } from 'lucide-react'
import { Link } from 'react-router'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useEntry, type FicEntry } from '@/features/entries/api'
import { ENTRY_FIELDS, SECTIONS, fieldsShownIn, type FieldSection } from '@/features/entries/fields'
import { LtoBadge } from '@/features/entries/LtoBadge'
import { formatField } from '@/features/entries/format'
import { formatExact } from '@/lib/time'

type EntryPreviewSheetProps = {
  entryId: number | null
  onClose: () => void
}

/** Full details of one entry, opened from a map popup's "View details". */
export function EntryPreviewSheet({ entryId, onClose }: EntryPreviewSheetProps) {
  const { data: entry, isPending, isError, error, refetch } = useEntry(entryId)

  return (
    <Sheet open={entryId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        {isPending ? (
          <PreviewSkeleton />
        ) : isError ? (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>Entry details</SheetTitle>
              <SheetDescription>The entry could not be loaded.</SheetDescription>
            </SheetHeader>
            <ErrorState error={error} onRetry={() => refetch()} className="flex-1" />
          </>
        ) : (
          <EntryDetails entry={entry} />
        )}
      </SheetContent>
    </Sheet>
  )
}

/** Shown in the header instead of the body. */
const HEADER_FIELDS = new Set(['name', 'host_institution', 'lto_status'])
const BODY_FIELDS = fieldsShownIn('preview').filter((key) => !HEADER_FIELDS.has(key))
const BODY_SECTIONS = [...new Set(BODY_FIELDS.map((key) => ENTRY_FIELDS[key].section))] as FieldSection[]

function EntryDetails({ entry }: { entry: FicEntry }) {

  return (
    <>
      <SheetHeader className="gap-2 border-b px-5 pt-6 pb-5">
        <LtoBadge status={entry.lto_status} className="w-fit" />
        <SheetTitle className="pr-8 text-lg leading-snug font-semibold tracking-tight text-balance">{entry.name}</SheetTitle>
        <SheetDescription>{entry.host_institution}</SheetDescription>
        {entry.is_mine && (
          <Button asChild variant="outline" size="sm" className="mt-2 w-fit">
            <Link to={`/entries/${entry.id}/edit`}>
              <Pencil data-icon="inline-start" />
              Edit entry
            </Link>
          </Button>
        )}
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {BODY_SECTIONS.map((section) => (
          <section key={section} className="mb-7 last:mb-0">
            <h3 className="mb-3 text-sm font-semibold tracking-tight">{SECTIONS[section].title}</h3>
            <dl className="grid gap-3">
              {BODY_FIELDS.filter((key) => ENTRY_FIELDS[key].section === section).map((key) => (
                  <div key={key} className="grid gap-0.5">
                    <dt className="text-xs text-muted-foreground">{ENTRY_FIELDS[key].label}</dt>
                    <dd className="text-sm break-words whitespace-pre-line tabular-nums">{formatField(entry, key)}</dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}
        <p className="mt-8 text-xs text-muted-foreground">Last updated {formatExact(entry.updated_at)}</p>
      </div>
    </>
  )
}

function PreviewSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-5 pt-6" aria-busy="true" aria-label="Loading entry">
      <SheetHeader className="sr-only">
        <SheetTitle>Loading entry</SheetTitle>
        <SheetDescription>Loading the entry details.</SheetDescription>
      </SheetHeader>
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="mt-6 grid gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="grid gap-1.5">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
