import { useMemo } from "react";
import { Link } from "react-router-dom";
import { formatDistanceFeet } from "../../lib/geo";
import { findNearbyPeople, groupNearbyPeopleByLocation } from "../../lib/personLocations";
import { useUserLocationStore } from "../../store/userLocationStore";
import type { Person } from "../../types";
import { InfoTooltip } from "../ui/InfoTooltip";

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function NearbyPeopleSection({
  people,
  latitude,
  longitude,
}: {
  people: Person[];
  latitude: number;
  longitude: number;
}) {
  const collapsed = useUserLocationStore((s) => s.nearbySectionCollapsed);
  const toggleCollapsed = useUserLocationStore((s) => s.toggleNearbySectionCollapsed);

  const groups = useMemo(() => {
    const nearby = findNearbyPeople(people, { latitude, longitude });
    return groupNearbyPeopleByLocation(nearby);
  }, [people, latitude, longitude]);

  const peopleCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.matches.length, 0),
    [groups],
  );

  if (groups.length === 0) return null;

  return (
    <section className="nearby-strip">
      <div className="nearby-strip-blobs" aria-hidden />
      <div className="nearby-strip-content">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleCollapsed()}
            aria-expanded={!collapsed}
            className="flex min-h-9 min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-md px-1 text-left transition-colors active:bg-white/40"
          >
            <ChevronIcon
              className={`h-4 w-4 shrink-0 text-bi-purple transition-transform ${collapsed ? "-rotate-90" : ""}`}
            />
            <h2 className="nearby-strip-title m-0 min-w-0 flex-1 truncate">Nearby</h2>
            {collapsed && (
              <span className="shrink-0 text-xs font-normal tabular-nums text-ink-muted">
                ({peopleCount})
              </span>
            )}
          </button>
          <span className="flex h-[1.35rem] shrink-0 items-center">
            <InfoTooltip label="About nearby people" />
          </span>
        </div>

        {!collapsed && (
          <ul className="mt-2 space-y-2">
            {groups.map((group) => (
              <li key={group.key}>
                <div className="flex items-baseline justify-between gap-2 px-0.5">
                  <h3 className="min-w-0 truncate text-sm font-medium text-ink">{group.placeName}</h3>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {formatDistanceFeet(group.distanceFeet)}
                  </span>
                </div>
                <ul className="mt-0.5 space-y-1">
                  {group.matches.map(({ person, location }) => (
                    <li key={`${group.key}-${person.nameKey}`}>
                      <Link
                        to={`/person/${encodeURIComponent(person.nameKey)}`}
                        className="flex items-baseline justify-between gap-2 rounded-md bg-white/80 px-3 py-2 ring-1 ring-bi-purple/20 transition-colors active:bg-white"
                      >
                        <span className="min-w-0 text-[0.9375rem] text-ink">
                          <span className="font-medium">{person.displayName}</span>
                          <span className="text-ink-muted"> · {location.label}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
