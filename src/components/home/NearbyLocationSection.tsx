import { useUserLocationStore } from "../../store/userLocationStore";
import type { Person } from "../../types";
import { InfoTooltip } from "../ui/InfoTooltip";
import { NearbyPeopleSection } from "./NearbyPeopleSection";

const NEARBY_LOCATION_TOOLTIP =
  "Share your location to see people with a saved place within 500 feet. Your location stays on this device and is only used for nearby matching and place search.";

export function NearbyLocationSection({ people }: { people: Person[] }) {
  const status = useUserLocationStore((s) => s.status);
  const latitude = useUserLocationStore((s) => s.latitude);
  const longitude = useUserLocationStore((s) => s.longitude);
  const nearbyPromptDismissed = useUserLocationStore((s) => s.nearbyPromptDismissed);
  const requestLocation = useUserLocationStore((s) => s.requestLocation);
  const dismissNearbyPrompt = useUserLocationStore((s) => s.dismissNearbyPrompt);

  if (status === "granted" && latitude != null && longitude != null) {
    return <NearbyPeopleSection people={people} latitude={latitude} longitude={longitude} />;
  }

  if (status === "unavailable" || nearbyPromptDismissed) return null;

  const denied = status === "denied";
  const loading = status === "loading";

  return (
    <section className="card-padded mb-4 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <h2 className="collection-section-title m-0">Nearby</h2>
          <span className="flex h-[1.35rem] items-center">
            <InfoTooltip label="About nearby location" text={NEARBY_LOCATION_TOOLTIP} />
          </span>
        </div>
        <button
          type="button"
          onClick={() => requestLocation()}
          disabled={loading}
          className="btn-primary btn-compact shrink-0"
        >
          {loading ? "Activating…" : denied ? "Try again" : "Activate location"}
        </button>
        <button
          type="button"
          onClick={() => dismissNearbyPrompt()}
          aria-label="Dismiss"
          className="btn-ghost btn-compact min-w-11 shrink-0 px-3"
        >
          ✕
        </button>
      </div>
      {denied && (
        <p className="mt-2 text-xs text-terracotta-dark">
          Location access was denied. Enable it in browser settings, then try again.
        </p>
      )}
    </section>
  );
}
