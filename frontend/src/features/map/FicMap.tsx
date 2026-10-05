import type { ReactNode } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { CARAGA_BOUNDS } from '@/features/map/constants'
import { cn } from '@/lib/utils'

type FicMapProps = {
  /** false renders a still, decorative map (no zoom, drag or keyboard focus). */
  interactive?: boolean
  className?: string
  children?: ReactNode
}

export function FicMap({ interactive = true, className, children }: FicMapProps) {
  return (
    <MapContainer
      bounds={CARAGA_BOUNDS}
      className={cn('size-full', className)}
      zoomControl={interactive}
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      boxZoom={interactive}
      keyboard={interactive}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      {children}
    </MapContainer>
  )
}
