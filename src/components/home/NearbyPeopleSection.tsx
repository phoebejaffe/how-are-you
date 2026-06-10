import { useMemo } from "react";
import { Link } from "react-router-dom";
import { formatDistanceFeet } from "../../lib/geo";
import { findNearbyPeople } from "../../lib/personLocations";
import type { Person } from "../../types";
import { InfoTooltip } from "../ui/InfoTooltip";

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
    <section className="nearby-strip">
      <div className="nearby-strip-blobs" aria-hidden />
      <div className="nearby-strip-content">
        <div className="flex items-center gap-1.5">
          <h2 className="nearby-strip-title m-0">Nearby</h2>
          <span className="flex h-[1.35rem] items-center">
            <InfoTooltip label="About nearby friends" />
          </span>
        </div>

        <ul className="mt-3.5 space-y-2">
          {nearby.map(({ person, location, distanceFeet }) => (
            <li key={`${person.nameKey}-${location.id}`}>
              <Link
                to={`/person/${encodeURIComponent(person.nameKey)}`}
                className="flex items-baseline justify-between gap-3 rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-bi-purple/20 transition-all active:scale-[0.99] active:bg-white"
              >
                <span className="min-w-0 text-[0.9375rem] text-ink">
                  <span className="font-medium">{person.displayName}</span>
                  <span className="text-ink-muted"> · {location.label}: {location.name}</span>
                </span>
                <span className="shrink-0 rounded-full bg-linear-to-r from-bi-pink/15 to-bi-blue/15 px-2 py-0.5 text-xs font-medium text-bi-purple">
                  {formatDistanceFeet(distanceFeet)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
