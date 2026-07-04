import { useEffect, useState } from "react";
import { sanitizePersonContext } from "../../lib/personContext";
import type { Person } from "../../types";
import { CheckIcon } from "../ui/CheckIcon";

export function PersonContextSection({
  person,
  onSave,
}: {
  person: Person;
  onSave: (context: string | undefined) => void;
}) {
  const saved = sanitizePersonContext(person.context) ?? "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(saved);

  useEffect(() => {
    setDraft(sanitizePersonContext(person.context) ?? "");
  }, [person.nameKey, person.context]);

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    onSave(sanitizePersonContext(draft));
    setEditing(false);
  }

  if (!editing && !saved) {
    return (
      <section className="mb-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-ink-muted transition-colors active:text-terracotta"
        >
          + Who they are
        </button>
      </section>
    );
  }

  if (!editing) {
    return (
      <section className="mb-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="block w-full text-left text-sm leading-relaxed text-ink-muted transition-colors active:text-terracotta"
        >
          {saved}
        </button>
      </section>
    );
  }

  return (
    <section className="mb-4">
      <form onSubmit={handleSave} className="space-y-2.5">
        <label htmlFor="person-context" className="section-label">
          Who they are
        </label>
        <textarea
          id="person-context"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="The tall brother, the juggler from Portland…"
          rows={2}
          className="input min-h-0 resize-none py-2.5"
          autoFocus
        />
        <div className="flex gap-2.5">
          <button type="submit" className="btn-primary btn-compact min-w-11 px-3" aria-label="Save">
            <CheckIcon />
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(saved);
              setEditing(false);
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
