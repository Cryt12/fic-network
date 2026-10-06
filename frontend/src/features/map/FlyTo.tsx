import type { LatLngBoundsLiteral } from 'leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

/** A point to zoom in on (e.g. a FIC), or an area to frame (e.g. a region). */
export type FlyTarget = { point: [number, number] } | { bounds: LatLngBoundsLiteral }

/** Glides the map to the target whenever a new target object is set. */
export function FlyTo({ target }: { target: FlyTarget | null }) {
  const map = useMap()

  useEffect(() => {
    if (!target) return
    const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if ('point' in target) map.flyTo(target.point, Math.max(map.getZoom(), 13), { animate, duration: 0.8 })
    else map.flyToBounds(target.bounds, { padding: [24, 24], animate, duration: 0.8 })
  }, [map, target])

  return null
}
