import { locationSummary } from "./personLocations";
import type { Person } from "../types";

export function sanitizePersonContext(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizePersonContext(person: Person): Person {
  const context = sanitizePersonContext(person.context);
  if (context === person.context) return person;
  if (!context) {
    const { context: _context, ...rest } = person;
    return rest;
  }
  return { ...person, context };
}

export function mergePersonContext(
  existing: string | undefined,
  imported: string | undefined,
): string | undefined {
  return sanitizePersonContext(existing) ?? sanitizePersonContext(imported);
}

export function personListSubtitles(person: Person): string[] {
  const context = sanitizePersonContext(person.context);
  if (context) return [context];

  const location = locationSummary(person);
  return location ? [location] : [];
}
