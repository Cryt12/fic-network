import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

/** Glides the map to a point whenever the target changes (e.g. a FIC picked from the list). */
export function FlyTo({ target }: { target: { latitude: number; longitude: number } | null }) {
  const map = useMap()

  useEffect(() => {
    if (!target) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    map.flyTo([target.latitude, target.longitude], Math.max(map.getZoom(), 13), { animate: !reduceMotion, duration: 0.8 })
  }, [map, target])

  return null
}
