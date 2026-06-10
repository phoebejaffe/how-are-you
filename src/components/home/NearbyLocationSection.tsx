import { useUserLocationStore } from "../../store/userLocationStore";
import type { Person } from "../../types";
import { NearbyPeopleSection } from "./NearbyPeopleSection";

export function NearbyLocationSection({ people }: { people: Person[] }) {
  const status = useUserLocationStore((s) => s.status);
  const latitude = useUserLocationStore((s) => s.latitude);
  const longitude = useUserLocationStore((s) => s.longitude);
  const requestLocation = useUserLocationStore((s) => s.requestLocation);

  if (status === "granted" && latitude != null && longitude != null) {
    return <NearbyPeopleSection people={people} latitude={latitude} longitude={longitude} />;
  }

  if (status === "unavailable") return null;

  const denied = status === "denied";
  const loading = status === "loading";

  return (
    <section className="card-padded mb-6">
      <h2 className="collection-section-title">Nearby</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Share your location to see friends with a saved place within 500 feet. Your location stays on
        this device and is only used for nearby matching and place search.
      </p>
      {denied && (
        <p className="mt-2 text-sm text-terracotta-dark">
          Location access was denied. You can enable it in browser settings, then try again.
        </p>
      )}
      <button
        type="button"
        onClick={() => requestLocation()}
        disabled={loading}
        className="btn-primary mt-4"
      >
        {loading ? "Getting location…" : denied ? "Try again" : "Share location"}
      </button>
    </section>
  );
}
