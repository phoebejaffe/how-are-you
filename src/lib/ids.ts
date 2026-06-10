import type { Person } from "../types";

export function createId(): string {
  return crypto.randomUUID();
}

export function personNameKey(displayName: string): string {
  return displayName.trim();
}

export function normalizePersonNameForComparison(name: string): string {
  return name.trim().toLocaleLowerCase();
}

export function personNameKeysMatch(a: string, b: string): boolean {
  return normalizePersonNameForComparison(a) === normalizePersonNameForComparison(b);
}

export function findPersonKey(people: Person[], urlKey: string): string | null {
  const trimmed = urlKey.trim();
  if (!trimmed) return null;
  const exact = people.find((person) => person.nameKey === trimmed);
  if (exact) return exact.nameKey;
  const target = normalizePersonNameForComparison(trimmed);
  const match = people.find((person) => normalizePersonNameForComparison(person.nameKey) === target);
  return match?.nameKey ?? null;
}

export function nowIso(): string {
  return new Date().toISOString();
}
