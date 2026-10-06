import { MapPinPlus, UsersRound } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useMapMarkers } from '@/features/entries/api'
import { EntryPreviewSheet } from '@/features/entries/EntryPreviewSheet'
import { EntryMarkers } from '@/features/map/EntryMarkers'
import { FicMap } from '@/features/map/FicMap'
import { RecentLoginsPanel } from '@/features/recent-logins/RecentLoginsPanel'
import { errorMessage } from '@/lib/api'
import { useDocumentTitle } from '@/lib/use-document-title'

export function DashboardPage() {
  useDocumentTitle('Map')
  const markers = useMapMarkers()
  const [params, setParams] = useSearchParams()

  // ?entry=ID opens the preview, so it's linkable and the back button closes it.
  const entryParam = Number(params.get('entry'))
  const previewId = Number.isInteger(entryParam) && entryParam > 0 ? entryParam : null

  useEffect(() => {
    if (markers.isError) toast.error(`Couldn't load the map pins. ${errorMessage(markers.error)}`, { id: 'markers-error' })
  }, [markers.isError, markers.error])

  return (
    <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <main className="relative min-h-0">
        <h1 className="sr-only">Map of FIC entries</h1>

        {/* isolate: keeps Leaflet's own z-indexes (up to 1000) below dialogs and drawers. */}
        <div className="absolute inset-0 isolate">
          <FicMap>
            {markers.data && <EntryMarkers markers={markers.data} onViewDetails={(id) => setParams({ entry: String(id) })} />}
          </FicMap>
        </div>

        {markers.isPending && (
          <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-md border bg-card/95 px-3 py-1.5 text-xs text-muted-foreground shadow-sm" role="status">
            Loading pins...
          </div>
        )}

        {/* Mobile and tablet: the Recently Logged In panel lives in a drawer. */}
        <div className="absolute top-3 right-3 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="bg-background/95 shadow-sm">
                <UsersRound data-icon="inline-start" />
                Recent logins
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 gap-0 p-0 pt-10"
              // Focus the drawer itself, not the first timestamp (which would pop its tooltip).
              onOpenAutoFocus={(event) => {
                event.preventDefault()
                const drawer = event.currentTarget as HTMLElement
                drawer.focus()
              }}
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Recently logged in</SheetTitle>
                <SheetDescription>Members who logged in most recently</SheetDescription>
              </SheetHeader>
              <RecentLoginsPanel />
            </SheetContent>
          </Sheet>
        </div>

        {markers.data?.length === 0 && (
          <div className="absolute inset-x-3 bottom-8 sm:right-auto sm:max-w-sm">
            <div className="rounded-lg border bg-card/95 p-4 shadow-[0_8px_24px_-12px_oklch(0.3_0.02_257/0.35)] backdrop-blur-sm">
              <p className="text-sm font-semibold tracking-tight">No FIC entries on the map yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Each entry you add shows up here as a pin.</p>
              <Button asChild size="sm" className="mt-3">
                <Link to="/entries/new">
                  <MapPinPlus data-icon="inline-start" />
                  Add New Entry
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      <aside className="hidden min-h-0 border-l bg-sidebar lg:block">
        <RecentLoginsPanel />
      </aside>

      <EntryPreviewSheet entryId={previewId} onClose={() => setParams({}, { replace: true })} />
    </div>
  )
}
