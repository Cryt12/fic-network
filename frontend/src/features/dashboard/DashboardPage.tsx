import { MapPinPlus, UsersRound } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { FicMap } from '@/features/map/FicMap'
import { RecentLoginsPanel } from '@/features/recent-logins/RecentLoginsPanel'
import { useDocumentTitle } from '@/lib/use-document-title'

export function DashboardPage() {
  useDocumentTitle('Map')

  return (
    <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <main className="relative min-h-0">
        <h1 className="sr-only">Map of FIC entries</h1>

        {/* isolate: keeps Leaflet's own z-indexes (up to 1000) below dialogs and drawers. */}
        <div className="absolute inset-0 isolate">
          <FicMap />
        </div>

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

        {/* Empty state until Phase 3/4 put entries on the map. */}
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
      </main>

      <aside className="hidden min-h-0 border-l bg-sidebar lg:block">
        <RecentLoginsPanel />
      </aside>
    </div>
  )
}
