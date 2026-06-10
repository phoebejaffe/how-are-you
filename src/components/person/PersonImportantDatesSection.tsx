import { useEffect, useState } from "react";
import {
  emptyImportantDate,
  formatImportantDate,
  sanitizeImportantDates,
} from "../../lib/personImportantDates";
import type { ImportantDate, Person } from "../../types";
import { CheckIcon } from "../ui/CheckIcon";

function personDates(person: Person): ImportantDate[] {
  return person.importantDates ?? [];
}

export function PersonImportantDatesSection({
  person,
  onSave,
}: {
  person: Person;
  onSave: (dates: ImportantDate[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<ImportantDate[]>([]);
  const saved = personDates(person);
  const hasDates = saved.length > 0;

  useEffect(() => {
    setDrafts(saved.length > 0 ? saved.map((entry) => ({ ...entry })) : [emptyImportantDate()]);
  }, [person.nameKey, person.importantDates]);

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    onSave(sanitizeImportantDates(drafts));
    setEditing(false);
  }

  function updateDraft(id: string, patch: Partial<ImportantDate>) {
    setDrafts((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  if (!editing && !hasDates) {
    return (
      <section className="mb-6">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-ink-muted transition-colors active:text-terracotta"
        >
          + Add important dates
        </button>
      </section>
    );
  }

  if (!editing) {
    return (
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="collection-section-title">Important dates</h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-ink-muted transition-colors active:text-terracotta"
          >
            Edit
          </button>
        </div>
        <ul className="space-y-2 text-sm text-ink">
          {saved.map((entry) => (
            <li key={entry.id}>
              <span className="font-medium">{entry.label}</span>
              <span className="text-ink-muted"> · {formatImportantDate(entry)}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="card-padded mb-6">
      <h2 className="collection-section-title">Important dates</h2>
      <form onSubmit={handleSave} className="mt-3 space-y-3">
        {drafts.map((entry) => (
          <div key={entry.id} className="grid gap-2 sm:grid-cols-[1fr_5rem_5rem_6rem_auto] sm:items-center">
            <input
              value={entry.label}
              onChange={(e) => updateDraft(entry.id, { label: e.target.value })}
              placeholder="Birthday, anniversary…"
              className="input input-compact"
            />
            <input
              type="number"
              min={1}
              max={12}
              value={entry.month}
              onChange={(e) => updateDraft(entry.id, { month: Number(e.target.value) })}
              aria-label="Month"
              className="input input-compact"
            />
            <input
              type="number"
              min={1}
              max={31}
              value={entry.day}
              onChange={(e) => updateDraft(entry.id, { day: Number(e.target.value) })}
              aria-label="Day"
              className="input input-compact"
            />
            <input
              type="number"
              min={1900}
              value={entry.year ?? ""}
              onChange={(e) =>
                updateDraft(entry.id, { year: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="Year"
              aria-label="Year (optional)"
              className="input input-compact"
            />
            <button
              type="button"
              onClick={() => setDrafts((current) => current.filter((item) => item.id !== entry.id))}
              aria-label="Remove date"
              className="btn-ghost btn-compact min-w-11 px-3"
            >
              ✕
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setDrafts((current) => [...current, emptyImportantDate()])}
            className="btn-ghost btn-compact"
          >
            Add another
          </button>
          <button type="submit" className="btn-primary btn-compact min-w-11 px-3" aria-label="Save">
            <CheckIcon />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setDrafts(saved.length > 0 ? saved.map((entry) => ({ ...entry })) : [emptyImportantDate()]);
            }}
            aria-label="Cancel"
            className="btn-ghost btn-compact min-w-11 px-3"
          >
            ✕
          </button>
        </div>
      </form>
    </section>
  );
}
