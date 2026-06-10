import { useMemo } from "react";
import { Link } from "react-router-dom";
import { formatDistanceFeet } from "../../lib/geo";
import { findNearbyPeople } from "../../lib/personLocations";
import type { Person } from "../../types";

export function NearbyPeopleSection({
  people,
  latitude,
  longitude,
}: {
  people: Person[];
  latitude: number;
  longitude: number;
}) {
  const nearby = useMemo(
    () => findNearbyPeople(people, { latitude, longitude }),
    [people, latitude, longitude],
  );

  if (nearby.length === 0) return null;

  return (
    <section className="card-padded mb-6">
      <div className="flex items-center gap-1.5">
        <h2 className="collection-section-title">Nearby</h2>
        <span className="group relative">
          <button
            type="button"
            className="inline-flex h-4 w-4 items-center justify-center rounded-full font-sans text-[10px] font-semibold leading-none text-ink-muted/70 ring-1 ring-stone-300/80 transition-colors hover:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/30"
            aria-label="About nearby friends"
            title="Friends with a saved location within 500 feet of you."
          >
            i
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute top-full left-1/2 z-10 mt-1.5 w-52 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-center font-sans text-[11px] font-normal normal-case tracking-normal text-cream opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          >
            Friends with a saved location within 500 feet of you.
          </span>
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {nearby.map(({ person, location, distanceFeet }) => (
          <li key={`${person.nameKey}-${location.id}`}>
            <Link
              to={`/person/${encodeURIComponent(person.nameKey)}`}
              className="flex items-baseline justify-between gap-3 rounded-xl px-1 py-2 transition-colors active:bg-white/60"
            >
              <span className="min-w-0 text-[0.9375rem] text-ink">
                <span className="font-medium">{person.displayName}</span>
                <span className="text-ink-muted"> · {location.label}: {location.name}</span>
              </span>
              <span className="shrink-0 text-xs text-ink-muted">{formatDistanceFeet(distanceFeet)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
