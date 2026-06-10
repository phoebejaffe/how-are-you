import { haversineMeters, SEARCH_BIAS_RADIUS_METERS, type GeoPoint } from "./geo";

export interface PlaceResult {
  name: string;
  subtitle?: string;
  latitude: number;
  longitude: number;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

function formatPlaceName(properties: PhotonFeature["properties"]): string {
  if (properties.name?.trim()) return properties.name.trim();
  const street = [properties.housenumber, properties.street].filter(Boolean).join(" ");
  if (street.trim()) return street.trim();
  return [properties.city, properties.state, properties.country].filter(Boolean).join(", ") || "Unknown place";
}

function formatPlaceSubtitle(properties: PhotonFeature["properties"], name: string): string | undefined {
  const parts = [
    [properties.housenumber, properties.street].filter(Boolean).join(" "),
    properties.city,
    properties.state,
    properties.country,
  ].filter((part) => part && part !== name);
  const subtitle = parts.join(", ");
  return subtitle || undefined;
}

function mapFeature(feature: PhotonFeature): PlaceResult {
  const [longitude, latitude] = feature.geometry.coordinates;
  const name = formatPlaceName(feature.properties);
  return {
    name,
    subtitle: formatPlaceSubtitle(feature.properties, name),
    latitude,
    longitude,
  };
}

export async function searchPlaces(query: string, near?: GeoPoint): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    limit: "12",
  });
  if (near) {
    params.set("lat", String(near.latitude));
    params.set("lon", String(near.longitude));
    params.set("zoom", "14");
    params.set("location_bias_scale", "0.2");
  }

  const url = `https://photon.komoot.io/api/?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Place search failed.");
  }

  const data = (await response.json()) as { features?: PhotonFeature[] };
  let results = (data.features ?? []).map(mapFeature);

  if (near) {
    // Photon lat/lon/zoom bias nudges the API; we strongly prefer hits within
    // SEARCH_BIAS_RADIUS_MILES via haversine, padding with farther matches only
    // when fewer than six local results exist.
    const ranked = results
      .map((place) => ({ place, distanceMeters: haversineMeters(near, place) }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
    const withinRadius = ranked.filter((item) => item.distanceMeters <= SEARCH_BIAS_RADIUS_METERS);
    const outsideRadius = ranked.filter((item) => item.distanceMeters > SEARCH_BIAS_RADIUS_METERS);
    results = [...withinRadius, ...outsideRadius].map((item) => item.place);
  }

  return results.slice(0, 6);
}

export function mapsUrl(location: { name: string; latitude?: number; longitude?: number }): string {
  if (location.latitude != null && location.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name)}`;
}
