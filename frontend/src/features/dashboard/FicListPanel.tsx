import { MapPin, MapPinOff, RotateCw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { MapMarker } from '@/features/entries/api'
import { cn } from '@/lib/utils'

type FicListPanelProps = {
  markers: MapMarker[] | undefined
  isPending: boolean
  isError: boolean
  onRetry: () => void
  onSelect: (marker: MapMarker) => void
}

/** Every registered FIC, newest first. Picking one flies the map to it and opens its details. */
export function FicListPanel({ markers, isPending, isError, onRetry, onSelect }: FicListPanelProps) {
  const [search, setSearch] = useState('')

  const fics = useMemo(() => {
    const term = search.trim().toLowerCase()
    return [...(markers ?? [])]
      .sort((a, b) => b.id - a.id)
      .filter((m) => !term || [m.name, m.host_institution, m.region_name].some((v) => v.toLowerCase().includes(term)))
  }, [markers, search])

  return (
    <section aria-labelledby="fic-list-heading" className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="fic-list-heading" className="text-sm font-semibold tracking-tight">
            Registered FICs
          </h2>
          {markers && <span className="text-xs text-muted-foreground tabular-nums">{markers.length}</span>}
        </div>
        {markers && markers.length > 0 && (
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FIC, institution, region"
              aria-label="Search registered FICs"
              className="bg-background pl-8"
            />
          </div>
        )}
      </header>

      <ScrollArea className="min-h-0 flex-1">
        {isPending ? (
          <div className="flex flex-col gap-1 px-4 py-2" aria-busy="true" aria-label="Loading FICs">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="grid gap-1.5 py-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : isError && !markers ? (
          <div className="flex flex-col items-start gap-3 px-4 py-6 text-sm">
            <p className="text-muted-foreground">The list couldn't be loaded.</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCw data-icon="inline-start" />
              Try again
            </Button>
          </div>
        ) : fics.length === 0 ? (
          <div className="flex flex-col items-start gap-2 px-4 py-6">
            <MapPinOff className="size-5 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {search ? 'No FIC matches that search.' : 'No FICs have signed up yet.'}
            </p>
          </div>
        ) : (
          <ul className="px-2 pb-3">
            {fics.map((fic) => (
              <li key={fic.id}>
                <button
                  type="button"
                  onClick={() => onSelect(fic)}
                  className="flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left outline-none transition-colors hover:bg-background focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <MapPin className={cn('mt-0.5 size-4 shrink-0', fic.is_mine ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm leading-snug font-medium">{fic.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {fic.host_institution}
                      <br />
                      {fic.region_name}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </section>
  )
}
