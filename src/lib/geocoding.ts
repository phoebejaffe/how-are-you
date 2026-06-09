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

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=6`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Place search failed.");
  }

  const data = (await response.json()) as { features?: PhotonFeature[] };
  return (data.features ?? []).map((feature) => {
    const [longitude, latitude] = feature.geometry.coordinates;
    const name = formatPlaceName(feature.properties);
    return {
      name,
      subtitle: formatPlaceSubtitle(feature.properties, name),
      latitude,
      longitude,
    };
  });
}

export function mapsUrl(location: { name: string; latitude?: number; longitude?: number }): string {
  if (location.latitude != null && location.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name)}`;
}
