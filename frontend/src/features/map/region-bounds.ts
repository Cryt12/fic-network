import type { LatLngBoundsLiteral } from 'leaflet'

/**
 * Approximate extent of each region ([south, west], [north, east]), keyed by the codes in
 * backend/config/regions.php. Used to zoom the location map when a region is picked;
 * they only need to frame the region, not trace its borders.
 */
export const REGION_BOUNDS: Record<string, LatLngBoundsLiteral> = {
  NCR: [[14.35, 120.9], [14.78, 121.15]],
  CAR: [[16.1, 120.4], [18.55, 121.65]],
  I: [[15.75, 119.75], [18.65, 120.95]],
  II: [[15.95, 120.8], [21.15, 122.6]],
  III: [[14.4, 119.75], [16.6, 122.1]],
  'IV-A': [[13.15, 120.55], [15.0, 122.75]],
  'IV-B': [[7.8, 116.9], [13.6, 122.7]],
  V: [[11.8, 122.3], [14.6, 124.45]],
  VI: [[10.4, 121.8], [12.05, 123.2]],
  NIR: [[9.0, 122.35], [11.05, 123.6]],
  VII: [[9.4, 123.25], [11.35, 124.65]],
  VIII: [[9.9, 124.2], [12.65, 125.8]],
  IX: [[6.85, 121.85], [8.8, 123.95]],
  X: [[7.3, 123.55], [9.3, 125.3]],
  XI: [[5.4, 125.0], [8.0, 126.65]],
  XII: [[5.55, 124.0], [7.65, 125.4]],
  XIII: [[7.95, 125.25], [10.45, 126.6]],
  BARMM: [[4.6, 119.3], [8.15, 124.85]],
}
