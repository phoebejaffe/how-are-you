import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PeopleMap } from "../components/map/PeopleMap";
import { collectMapLocationPins } from "../lib/mapLocations";
import { useAppStore } from "../store/appStore";
import { useUserLocationStore } from "../store/userLocationStore";

export function MapPage() {
  const people = useAppStore((s) => s.people);
  const pendingDeletes = useAppStore((s) => s.pendingDeletes);
  const userLatitude = useUserLocationStore((s) => s.latitude);
  const userLongitude = useUserLocationStore((s) => s.longitude);

  const pins = useMemo(
    () => collectMapLocationPins(people.filter((person) => !pendingDeletes.has(person.nameKey))),
    [people, pendingDeletes],
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="page page-enter shrink-0 pb-3">
        <Link to="/" className="back-link">
          ← My people
        </Link>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[1.75rem] font-normal text-ink sm:text-3xl">Map</h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              {pins.length === 0
                ? "Saved places with coordinates will appear here."
                : `${pins.length} saved ${pins.length === 1 ? "place" : "places"}`}
            </p>
          </div>
          <Link to="/settings" className="btn-ghost btn-compact mt-1 shrink-0">
            Settings
          </Link>
        </div>
      </div>

      <div className="map-shell">
        <PeopleMap pins={pins} userLatitude={userLatitude} userLongitude={userLongitude} />
      </div>
    </div>
  );
}
