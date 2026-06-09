import { useEffect, useState } from "react";
import { mapsUrl } from "../../lib/geocoding";
import { createId } from "../../lib/ids";
import { legacyLocationsFromPerson, sanitizePersonLocations } from "../../lib/personLocations";
import type { Person, PersonLocation } from "../../types";
import { CheckIcon } from "../ui/CheckIcon";
import { LocationSearchInput } from "../ui/LocationSearchInput";

function personLocations(person: Person): PersonLocation[] {
  return person.locations ?? legacyLocationsFromPerson(person);
}

function emptyDraft(): PersonLocation {
  return { id: createId(), label: "", name: "" };
}

export function PersonLocationsSection({
  person,
  onSave,
}: {
  person: Person;
  onSave: (locations: PersonLocation[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<PersonLocation[]>([]);

  const saved = personLocations(person);
  const hasLocations = saved.length > 0;

  useEffect(() => {
    setDrafts(saved.length > 0 ? saved.map((location) => ({ ...location })) : [emptyDraft()]);
  }, [person.nameKey, person.locations, person.metLocation, person.workLocation]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    onSave(sanitizePersonLocations(drafts));
    setEditing(false);
  }

  function updateDraft(id: string, patch: Partial<PersonLocation>) {
    setDrafts((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  if (!editing && !hasLocations) {
    return (
      <section className="mb-6">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-ink-muted transition-colors active:text-terracotta"
        >
          + add locations
        </button>
      </section>
    );
  }

  if (!editing) {
    return (
      <section className="mb-6 space-y-2">
        {saved.map((location) => (
          <p key={location.id} className="text-sm text-ink-muted">
            <span className="font-medium text-ink">{location.label}:</span>{" "}
            <a
              href={mapsUrl(location)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracotta underline-offset-2 hover:underline"
            >
              {location.name}
            </a>
          </p>
        ))}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="pt-1 text-sm text-ink-muted transition-colors active:text-terracotta"
        >
          Edit locations
        </button>
      </section>
    );
  }

  return (
    <section className="card-padded mb-6 space-y-3">
      <h2 className="collection-section-title">Locations</h2>
      <form onSubmit={handleSave} className="space-y-4">
        {drafts.map((location) => (
          <div key={location.id} className="flex flex-wrap items-start gap-2">
            <input
              value={location.label}
              onChange={(e) => updateDraft(location.id, { label: e.target.value })}
              placeholder="Label"
              className="input input-compact w-24 shrink-0"
              aria-label="Location label"
            />
            <LocationSearchInput
              value={location.name}
              onChange={(name) =>
                updateDraft(location.id, { name, latitude: undefined, longitude: undefined })
              }
              onSelectPlace={(place) =>
                updateDraft(location.id, {
                  name: place.name,
                  latitude: place.latitude,
                  longitude: place.longitude,
                })
              }
            />
            <button
              type="button"
              onClick={() => setDrafts((current) => current.filter((entry) => entry.id !== location.id))}
              className="btn-ghost btn-compact min-w-11 px-3"
              aria-label="Remove location"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setDrafts((current) => [...current, emptyDraft()])}
          className="text-sm text-ink-muted transition-colors active:text-terracotta"
        >
          + add another
        </button>

        <div className="flex gap-2.5 pt-1">
          <button type="submit" className="btn-primary btn-compact min-w-11 px-3" aria-label="Save">
            <CheckIcon />
          </button>
          <button
            type="button"
            onClick={() => {
              setDrafts(saved.length > 0 ? saved.map((location) => ({ ...location })) : [emptyDraft()]);
              setEditing(false);
            }}
            className="btn-ghost btn-compact min-w-11 px-3"
            aria-label="Cancel"
          >
            ✕
          </button>
        </div>
      </form>
    </section>
  );
}
