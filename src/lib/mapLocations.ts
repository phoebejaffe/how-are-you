import { normalizePersonLocations } from "./personLocations";
import type { Person } from "../types";

export interface MapLocationPin {
  id: string;
  personNameKey: string;
  personDisplayName: string;
  label: string;
  placeName: string;
  latitude: number;
  longitude: number;
}

export function collectMapLocationPins(people: Person[]): MapLocationPin[] {
  const pins: MapLocationPin[] = [];

  for (const person of people) {
    const normalized = normalizePersonLocations(person);
    for (const location of normalized.locations ?? []) {
      if (location.latitude == null || location.longitude == null) continue;
      pins.push({
        id: `${person.nameKey}:${location.id}`,
        personNameKey: person.nameKey,
        personDisplayName: person.displayName,
        label: location.label,
        placeName: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }

  return pins.sort(
    (a, b) =>
      a.personDisplayName.localeCompare(b.personDisplayName) ||
      a.label.localeCompare(b.label) ||
      a.placeName.localeCompare(b.placeName),
  );
}
