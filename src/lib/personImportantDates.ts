import { createId } from "./ids";
import type { ImportantDate, Person } from "../types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function sanitizeImportantDates(drafts: ImportantDate[]): ImportantDate[] {
  return drafts
    .map((entry) => ({
      ...entry,
      label: entry.label.trim(),
      month: Math.trunc(entry.month),
      day: Math.trunc(entry.day),
      year: entry.year == null ? undefined : Math.trunc(entry.year),
    }))
    .filter(
      (entry) =>
        entry.label.length > 0 &&
        entry.month >= 1 &&
        entry.month <= 12 &&
        entry.day >= 1 &&
        entry.day <= 31 &&
        (entry.year == null || entry.year >= 1900),
    );
}

export function emptyImportantDate(): ImportantDate {
  return { id: createId(), label: "", month: 1, day: 1 };
}

export function formatImportantDate(date: ImportantDate): string {
  const month = MONTHS[date.month - 1] ?? String(date.month);
  return date.year ? `${month} ${date.day}, ${date.year}` : `${month} ${date.day}`;
}

export function normalizePersonImportantDates(person: Person): Person {
  if (!person.importantDates?.length) {
    if (person.importantDates === undefined) return person;
    const { importantDates: _dates, ...rest } = person;
    return rest;
  }
  const importantDates = sanitizeImportantDates(person.importantDates);
  return importantDates.length > 0 ? { ...person, importantDates } : normalizePersonImportantDates({ ...person, importantDates: [] });
}

export function mergeImportantDates(
  existing: ImportantDate[] | undefined,
  imported: ImportantDate[] | undefined,
): ImportantDate[] | undefined {
  const merged = [...(existing ?? []), ...(imported ?? [])];
  return merged.length > 0 ? merged : undefined;
}

export function importantDateSummary(dates: ImportantDate[] | undefined): string | undefined {
  if (!dates?.length) return undefined;
  const first = dates[0];
  const extra = dates.length > 1 ? ` +${dates.length - 1}` : "";
  return `${first.label}: ${formatImportantDate(first)}${extra}`;
}
