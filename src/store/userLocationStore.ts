import { create } from "zustand";

export type UserLocationStatus = "idle" | "loading" | "granted" | "denied" | "unavailable";

interface UserLocationState {
  status: UserLocationStatus;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  requestLocation: () => void;
}

export const useUserLocationStore = create<UserLocationState>((set, get) => ({
  status: "idle",
  latitude: null,
  longitude: null,
  accuracyMeters: null,

  requestLocation() {
    const { status } = get();
    if (status === "loading" || status === "granted") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      set({ status: "unavailable" });
      return;
    }

    set({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        set({
          status: "granted",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        });
      },
      (error) => {
        set({
          status: error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
          latitude: null,
          longitude: null,
          accuracyMeters: null,
        });
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 120_000 },
    );
  },
}));
