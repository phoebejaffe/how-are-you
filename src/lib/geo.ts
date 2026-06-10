export const METERS_PER_FOOT = 0.3048;
export const FEET_PER_MILE = 5280;
export const NEARBY_RADIUS_FEET = 500;
export const NEARBY_RADIUS_METERS = NEARBY_RADIUS_FEET * METERS_PER_FOOT;
export const SEARCH_BIAS_RADIUS_MILES = 5;
export const SEARCH_BIAS_RADIUS_METERS =
  SEARCH_BIAS_RADIUS_MILES * FEET_PER_MILE * METERS_PER_FOOT;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistanceFeet(feet: number): string {
  if (feet < 50) return "nearby";
  if (feet < 1000) return `${Math.round(feet / 10) * 10} ft`;
  return `${(feet / 5280).toFixed(1)} mi`;
}
