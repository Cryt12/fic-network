import type { LeafletMouseEvent, Marker as LeafletMarker } from 'leaflet'
import { Crosshair, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { FieldError as FormFieldError } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { CARAGA_BOUNDS } from '@/features/map/constants'
import { pinIcon } from '@/features/map/icons'

type GeotagPickerProps = {
  latitude: number | undefined
  longitude: number | undefined
  onChange: (latitude: number | undefined, longitude: number | undefined) => void
  errors: { latitude?: FormFieldError; longitude?: FormFieldError }
}

/** Matches the database column, numeric(10,7). */
const round = (n: number) => Math.round(n * 1e7) / 1e7

const isValid = (lat: number | undefined, lng: number | undefined): lat is number =>
  lat !== undefined && lng !== undefined && Math.abs(lat) <= 90 && Math.abs(lng) <= 180

/**
 * Set a FIC's geotag four ways: click the map, drag the pin, use the browser's location,
 * or type the coordinates. All four stay in sync.
 */
export function GeotagPicker({ latitude, longitude, onChange, errors }: GeotagPickerProps) {
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)
  const hasPoint = isValid(latitude, longitude)

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocateError("This browser can't share its location. Click the map instead.")
      return
    }
    setLocating(true)
    setLocateError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        onChange(round(position.coords.latitude), round(position.coords.longitude))
      },
      (error) => {
        setLocating(false)
        setLocateError(
          error.code === error.PERMISSION_DENIED
            ? 'Location access was blocked. Allow it in your browser, or click the map instead.'
            : "Couldn't get your location. Click the map instead.",
        )
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id="geotag-help" className="text-sm text-muted-foreground">
          Click the map to drop a pin, then drag it to fine-tune.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={locating}>
          {locating ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Crosshair data-icon="inline-start" />}
          Use my current location
        </Button>
      </div>

      <div className="isolate h-72 overflow-hidden rounded-lg border sm:h-80" aria-describedby="geotag-help">
        <MapContainer
          bounds={hasPoint ? undefined : CARAGA_BOUNDS}
          center={hasPoint ? [latitude, longitude!] : undefined}
          zoom={hasPoint ? 14 : undefined}
          className="size-full"
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
          <ClickToPlace onPlace={(lat, lng) => onChange(round(lat), round(lng))} />
          {hasPoint && (
            <>
              <Marker
                position={[latitude, longitude!]}
                icon={pinIcon}
                draggable
                keyboard={false}
                eventHandlers={{
                  dragend: (event) => {
                    const { lat, lng } = (event.target as LeafletMarker).getLatLng()
                    onChange(round(lat), round(lng))
                  },
                }}
              />
              <KeepInView latitude={latitude} longitude={longitude!} />
            </>
          )}
        </MapContainer>
      </div>

      {locateError && (
        <p role="alert" className="text-sm text-destructive">
          {locateError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <CoordinateInput
          id="latitude"
          label="Latitude"
          hint="-90 to 90"
          value={latitude}
          error={errors.latitude}
          onChange={(value) => onChange(value, longitude)}
        />
        <CoordinateInput
          id="longitude"
          label="Longitude"
          hint="-180 to 180"
          value={longitude}
          error={errors.longitude}
          onChange={(value) => onChange(latitude, value)}
        />
      </div>
    </div>
  )
}

function ClickToPlace({ onPlace }: { onPlace: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (event: LeafletMouseEvent) => onPlace(event.latlng.lat, event.latlng.lng) })
  return null
}

/** Pans to the pin when it is set from outside the map (typed or geolocated). */
function KeepInView({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap()
  useEffect(() => {
    if (!map.getBounds().contains([latitude, longitude])) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), 13))
    }
  }, [map, latitude, longitude])
  return null
}

type CoordinateInputProps = {
  id: string
  label: string
  hint: string
  value: number | undefined
  error?: FormFieldError
  onChange: (value: number | undefined) => void
}

/** Keeps its own text so half-typed values like "8." or "-" aren't wiped out. */
function CoordinateInput({ id, label, hint, value, error, onChange }: CoordinateInputProps) {
  const [text, setText] = useState(value === undefined ? '' : String(value))
  const [lastValue, setLastValue] = useState(value)

  // The value changed from outside (map click, drag, geolocation): show it.
  if (value !== lastValue) {
    setLastValue(value)
    if (value !== parseCoordinate(text)) setText(value === undefined ? '' : String(value))
  }

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
        onChange={(event) => {
          setText(event.target.value)
          onChange(parseCoordinate(event.target.value))
        }}
        className="tabular-nums"
      />
      <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>
      <FieldError id={`${id}-error`} errors={error ? [error] : undefined} />
    </Field>
  )
}

function parseCoordinate(text: string): number | undefined {
  const trimmed = text.trim()
  if (trimmed === '') return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}
