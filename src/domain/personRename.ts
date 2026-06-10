import type { Person } from "../types";
import { personNameKey, personNameKeysMatch } from "../lib/ids";

export function validateRename(
  people: Person[],
  currentKey: string,
  newDisplayName: string,
): { ok: true; newKey: string } | { ok: false; error: string } {
  const trimmed = newDisplayName.trim();
  if (!trimmed) {
    return { ok: false, error: "Name cannot be empty." };
  }
  const newKey = personNameKey(trimmed);
  if (newKey === currentKey) {
    return { ok: true, newKey };
  }
  if (people.some((p) => p.nameKey !== currentKey && personNameKeysMatch(p.nameKey, newKey))) {
    return { ok: false, error: `Someone named "${trimmed}" already exists.` };
  }
  return { ok: true, newKey };
}
