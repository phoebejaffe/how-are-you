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
      <h2 className="collection-section-title">Nearby</h2>
      <p className="mt-1.5 text-sm text-ink-muted">
        Friends with a saved location within 500 feet of you.
      </p>
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
