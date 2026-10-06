import { List, MapPinPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useMapMarkers, type MapMarker } from '@/features/entries/api'
import { EntryPreviewSheet } from '@/features/entries/EntryPreviewSheet'
import { EntryMarkers } from '@/features/map/EntryMarkers'
import { FicMap } from '@/features/map/FicMap'
import { FicListPanel } from '@/features/dashboard/FicListPanel'
import { FlyTo } from '@/features/map/FlyTo'
import { errorMessage } from '@/lib/api'
import { useDocumentTitle } from '@/lib/use-document-title'

export function DashboardPage() {
  useDocumentTitle('Map')
  const markers = useMapMarkers()
  const [params, setParams] = useSearchParams()
  const [focus, setFocus] = useState<MapMarker | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  /** From the FIC list: fly to its pin and open its details. */
  const selectFic = (fic: MapMarker) => {
    setFocus(fic)
    setDrawerOpen(false)
    setParams({ entry: String(fic.id) })
  }

  const list = (
    <FicListPanel
      markers={markers.data}
      isPending={markers.isPending}
      isError={markers.isError}
      onRetry={() => markers.refetch()}
      onSelect={selectFic}
    />
  )

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

        {/* Framed map. isolate: keeps Leaflet's own z-indexes (up to 1000) below dialogs and drawers. */}
        <div className="absolute inset-3 isolate overflow-hidden rounded-lg border shadow-[0_6px_20px_-12px_oklch(0.3_0.02_257/0.35)] sm:inset-4">
          <FicMap>
            {markers.data && <EntryMarkers markers={markers.data} onViewDetails={(id) => setParams({ entry: String(id) })} />}
            <FlyTo target={focus} />
          </FicMap>
        </div>

        {markers.isPending && (
          <div className="pointer-events-none absolute top-7 left-1/2 -translate-x-1/2 rounded-md border bg-card/95 px-3 py-1.5 text-xs text-muted-foreground shadow-sm" role="status">
            Loading pins...
          </div>
        )}

        {/* Mobile and tablet: the FIC list lives in a drawer. */}
        <div className="absolute top-6 right-6 sm:top-7 sm:right-7 lg:hidden">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="bg-background/95 shadow-sm">
                <List data-icon="inline-start" />
                FICs
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 gap-0 bg-muted p-0 pt-8"
              // Focus the drawer itself, not the search box (which would pop up the phone keyboard).
              onOpenAutoFocus={(event) => {
                event.preventDefault()
                const drawer = event.currentTarget as HTMLElement
                drawer.focus()
              }}
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Registered FICs</SheetTitle>
                <SheetDescription>Every FIC on the map</SheetDescription>
              </SheetHeader>
              {list}
            </SheetContent>
          </Sheet>
        </div>

        {markers.data?.length === 0 && (
          <div className="absolute inset-x-6 bottom-10 sm:right-auto sm:left-7 sm:max-w-sm">
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

      <aside className="hidden min-h-0 border-l bg-muted lg:block">
        {list}
      </aside>

      <EntryPreviewSheet entryId={previewId} onClose={() => setParams({}, { replace: true })} />
    </div>
  )
}
