import type { Person, PersonBundle } from "../types";

export function personMatchesSearch(
  person: Person,
  bundle: PersonBundle | undefined,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (person.displayName.toLowerCase().includes(q)) return true;
  if (!bundle) return false;
  if (bundle.topics.some((topic) => topic.text.toLowerCase().includes(q))) return true;
  if (bundle.facts.some((fact) => fact.text.toLowerCase().includes(q))) return true;
  if (bundle.followUps.some((followUp) => followUp.text.toLowerCase().includes(q))) return true;
  return false;
}
