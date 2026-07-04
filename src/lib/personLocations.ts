import { createId } from "./ids";
import { haversineMeters, METERS_PER_FOOT, NEARBY_RADIUS_METERS, type GeoPoint } from "./geo";
import type { Person, PersonLocation } from "../types";

export function legacyLocationsFromPerson(person: Person): PersonLocation[] {
  const locations: PersonLocation[] = [];
  if (person.metLocation?.trim()) {
    locations.push({ id: createId(), label: "Met", name: person.metLocation.trim() });
  }
  if (person.workLocation?.trim()) {
    locations.push({ id: createId(), label: "Works", name: person.workLocation.trim() });
  }
  return locations;
}

export function normalizePersonLocations(person: Person): Person {
  if (person.locations?.length) {
    const { metLocation: _met, workLocation: _work, ...rest } = person;
    return rest;
  }

  const locations = legacyLocationsFromPerson(person);
  if (locations.length === 0) {
    const { metLocation: _met, workLocation: _work, ...rest } = person;
    return rest;
  }

  const { metLocation: _met, workLocation: _work, ...rest } = person;
  return { ...rest, locations };
}

export function sanitizePersonLocations(locations: PersonLocation[]): PersonLocation[] {
  return locations
    .map((location) => ({
      ...location,
      id: location.id || createId(),
      label: location.label.trim(),
      name: location.name.trim(),
    }))
    .filter((location) => location.label && location.name);
}

export function locationSummary(person: Person): string | null {
  const locations = person.locations ?? legacyLocationsFromPerson(person);
  if (locations.length === 0) return null;
  return locations.map((location) => location.name).join(" · ");
}

export function mergePersonLocations(
  existing: PersonLocation[] | undefined,
  imported: PersonLocation[] | undefined,
): PersonLocation[] | undefined {
  const merged = [...(existing ?? [])];

  for (const item of imported ?? []) {
    const duplicate = merged.find(
      (entry) =>
        entry.label === item.label &&
        entry.name === item.name &&
        entry.latitude === item.latitude &&
        entry.longitude === item.longitude,
    );
    if (duplicate) continue;

    const sameLabel = merged.find((entry) => entry.label === item.label);
    if (sameLabel && !sameLabel.latitude && item.latitude != null) {
      sameLabel.name = item.name;
      sameLabel.latitude = item.latitude;
      sameLabel.longitude = item.longitude;
      continue;
    }

    merged.push(item);
  }

  return merged.length > 0 ? merged : undefined;
}

export interface NearbyPersonMatch {
  person: Person;
  location: PersonLocation;
  distanceFeet: number;
}

export function findNearbyPeople(
  people: Person[],
  userLocation: GeoPoint,
  radiusMeters = NEARBY_RADIUS_METERS,
): NearbyPersonMatch[] {
  const matches: NearbyPersonMatch[] = [];

  for (const person of people) {
    const locations = person.locations ?? legacyLocationsFromPerson(person);
    for (const location of locations) {
      if (location.latitude == null || location.longitude == null) continue;
      const distanceMeters = haversineMeters(userLocation, {
        latitude: location.latitude,
        longitude: location.longitude,
      });
      if (distanceMeters <= radiusMeters) {
        matches.push({
          person,
          location,
          distanceFeet: distanceMeters / METERS_PER_FOOT,
        });
      }
    }
  }

  return matches.sort((a, b) => a.distanceFeet - b.distanceFeet);
}

export interface NearbyLocationGroup {
  key: string;
  placeName: string;
  latitude: number;
  longitude: number;
  distanceFeet: number;
  matches: NearbyPersonMatch[];
}

function nearbyLocationKey(location: PersonLocation): string | null {
  if (location.latitude == null || location.longitude == null) return null;
  return `${location.latitude.toFixed(6)},${location.longitude.toFixed(6)}`;
}

export function groupNearbyPeopleByLocation(matches: NearbyPersonMatch[]): NearbyLocationGroup[] {
  const groups = new Map<string, NearbyLocationGroup>();

  for (const match of matches) {
    const key = nearbyLocationKey(match.location);
    if (!key) continue;

    const existing = groups.get(key);
    if (existing) {
      const duplicatePerson = existing.matches.some((entry) => entry.person.nameKey === match.person.nameKey);
      if (!duplicatePerson) existing.matches.push(match);
      existing.distanceFeet = Math.min(existing.distanceFeet, match.distanceFeet);
      if (match.location.name.length > existing.placeName.length) {
        existing.placeName = match.location.name;
      }
      continue;
    }

    groups.set(key, {
      key,
      placeName: match.location.name,
      latitude: match.location.latitude!,
      longitude: match.location.longitude!,
      distanceFeet: match.distanceFeet,
      matches: [match],
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      matches: group.matches.sort(
        (a, b) =>
          a.distanceFeet - b.distanceFeet ||
          a.person.displayName.localeCompare(b.person.displayName),
      ),
    }))
    .sort(
      (a, b) => a.distanceFeet - b.distanceFeet || a.placeName.localeCompare(b.placeName),
    );
}
