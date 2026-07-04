import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapLocationPin } from "../../lib/mapLocations";

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const PERSON_PIN_STYLE: L.CircleMarkerOptions = {
  radius: 8,
  fillColor: "#9b4f96",
  color: "#ffffff",
  weight: 2,
  fillOpacity: 0.92,
};

const USER_PIN_STYLE: L.CircleMarkerOptions = {
  radius: 7,
  fillColor: "#6d8f7a",
  color: "#ffffff",
  weight: 2,
  fillOpacity: 1,
};

function personUrl(nameKey: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  return `${base}person/${encodeURIComponent(nameKey)}`;
}

function buildPopup(pin: MapLocationPin): HTMLElement {
  const root = document.createElement("div");
  root.className = "min-w-[10rem] text-sm leading-snug";

  const link = document.createElement("a");
  link.href = personUrl(pin.personNameKey);
  link.textContent = pin.personDisplayName;
  link.className = "font-medium text-terracotta";

  const detail = document.createElement("p");
  detail.className = "mt-1 text-ink-muted";
  detail.textContent = `${pin.label}: ${pin.placeName}`;

  root.append(link, detail);
  return root;
}

export function PeopleMap({
  pins,
  userLatitude,
  userLongitude,
}: {
  pins: MapLocationPin[];
  userLatitude?: number | null;
  userLongitude?: number | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, { zoomControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: OSM_ATTRIBUTION,
    }).addTo(map);

    mapRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const layer of markersRef.current) {
      layer.remove();
    }
    markersRef.current = [];

    for (const pin of pins) {
      const marker = L.circleMarker([pin.latitude, pin.longitude], PERSON_PIN_STYLE)
        .bindPopup(buildPopup(pin))
        .addTo(map);
      markersRef.current.push(marker);
    }

    if (userLatitude != null && userLongitude != null) {
      const userMarker = L.circleMarker([userLatitude, userLongitude], USER_PIN_STYLE)
        .bindPopup("You are here")
        .addTo(map);
      markersRef.current.push(userMarker);
    }

    const boundsPoints: L.LatLngExpression[] = pins.map((pin) => [pin.latitude, pin.longitude]);
    if (userLatitude != null && userLongitude != null) {
      boundsPoints.push([userLatitude, userLongitude]);
    }

    if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 14);
    } else if (boundsPoints.length > 1) {
      map.fitBounds(L.latLngBounds(boundsPoints), { padding: [36, 36], maxZoom: 14 });
    } else {
      map.setView([20, 0], 2);
    }

    requestAnimationFrame(() => map.invalidateSize());
  }, [pins, userLatitude, userLongitude]);

  return <div ref={containerRef} className="map-canvas" role="application" aria-label="Map of saved places" />;
}
