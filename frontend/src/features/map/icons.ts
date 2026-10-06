import { divIcon } from 'leaflet'

// CSS-drawn pins (see .fic-pin in index.css): they follow the theme tokens, and avoid
// Leaflet's default PNG icons, whose URLs break under bundlers.

export const pinIcon = divIcon({
  className: 'fic-pin-wrapper',
  html: '<span class="fic-pin"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -26],
})

/** Your own entries get a filled center, so you can spot them among everyone's. */
export const myPinIcon = divIcon({
  className: 'fic-pin-wrapper',
  html: '<span class="fic-pin fic-pin--mine"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -26],
})

export function clusterIcon(cluster: { getChildCount(): number }) {
  const count = cluster.getChildCount()
  const size = count < 10 ? 34 : count < 100 ? 40 : 46
  return divIcon({
    className: 'fic-cluster-wrapper',
    html: `<span class="fic-cluster" style="width:${size}px;height:${size}px">${count}</span>`,
    iconSize: [size, size],
  })
}
