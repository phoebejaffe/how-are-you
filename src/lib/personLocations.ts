import { createId } from "./ids";
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
