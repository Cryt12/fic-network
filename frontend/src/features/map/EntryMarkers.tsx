import { latLngBounds } from 'leaflet'
import { ArrowRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { Button } from '@/components/ui/button'
import type { MapMarker } from '@/features/entries/api'
import { ENTRY_FIELDS, fieldsShownIn } from '@/features/entries/fields'
import { LtoBadge } from '@/features/entries/LtoBadge'
import { formatField } from '@/features/entries/format'
import { clusterIcon, myPinIcon, pinIcon } from '@/features/map/icons'

type EntryMarkersProps = {
  markers: MapMarker[]
  onViewDetails: (id: number) => void
}

/** Clustered pins with a short summary popup. Fits the map to the pins on first load. */
export function EntryMarkers({ markers, onViewDetails }: EntryMarkersProps) {
  return (
    <>
      <FitToMarkers markers={markers} />
      <MarkerClusterGroup chunkedLoading iconCreateFunction={clusterIcon} showCoverageOnHover={false} maxClusterRadius={48}>
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={marker.is_mine ? myPinIcon : pinIcon}
            title={marker.name}
            alt={marker.name}
          >
            <Popup minWidth={240} maxWidth={300}>
              <MarkerPopup marker={marker} onViewDetails={() => onViewDetails(marker.id)} />
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </>
  )
}

function MarkerPopup({ marker, onViewDetails }: { marker: MapMarker; onViewDetails: () => void }) {
  // Fields flagged showIn.popup in fields.ts; name and LTO get special treatment.
  const rest = fieldsShownIn('popup').filter((key) => key !== 'name' && key !== 'lto_status')

  return (
    <div className="flex flex-col gap-2 font-sans">
      <LtoBadge status={marker.lto_status} className="w-fit" />
      <p className="text-sm leading-snug font-semibold tracking-tight text-foreground">{marker.name}</p>
      <dl className="grid gap-1">
        {rest.map((key) => (
          <div key={key}>
            <dt className="sr-only">{ENTRY_FIELDS[key].label}</dt>
            <dd className="text-xs text-muted-foreground">{formatField(marker, key)}</dd>
          </div>
        ))}
      </dl>
      <Button size="sm" className="mt-1 w-fit" onClick={onViewDetails}>
        View details
        <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  )
}

function FitToMarkers({ markers }: { markers: MapMarker[] }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (fitted.current || markers.length === 0) return
    fitted.current = true
    const bounds = latLngBounds(markers.map((m) => [m.latitude, m.longitude]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 })
  }, [map, markers])

  return null
}
