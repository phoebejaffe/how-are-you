import { create } from "zustand";

export type UserLocationStatus = "idle" | "loading" | "granted" | "denied" | "unavailable";

const NEARBY_PROMPT_DISMISSED_KEY = "how-are-you/nearby-prompt-dismissed";
const NEARBY_SECTION_COLLAPSED_KEY = "how-are-you/nearby-section-collapsed";

function readNearbyPromptDismissed(): boolean {
  try {
    return localStorage.getItem(NEARBY_PROMPT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function readNearbySectionCollapsed(): boolean {
  try {
    return localStorage.getItem(NEARBY_SECTION_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

interface UserLocationState {
  status: UserLocationStatus;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  nearbyPromptDismissed: boolean;
  nearbySectionCollapsed: boolean;
  requestLocation: () => void;
  dismissNearbyPrompt: () => void;
  toggleNearbySectionCollapsed: () => void;
}

export const useUserLocationStore = create<UserLocationState>((set, get) => ({
  status: "idle",
  latitude: null,
  longitude: null,
  accuracyMeters: null,
  nearbyPromptDismissed: readNearbyPromptDismissed(),
  nearbySectionCollapsed: readNearbySectionCollapsed(),

  dismissNearbyPrompt() {
    try {
      localStorage.setItem(NEARBY_PROMPT_DISMISSED_KEY, "1");
    } catch {
      // ignore storage errors
    }
    set({ nearbyPromptDismissed: true });
  },

  toggleNearbySectionCollapsed() {
    const next = !get().nearbySectionCollapsed;
    try {
      if (next) {
        localStorage.setItem(NEARBY_SECTION_COLLAPSED_KEY, "1");
      } else {
        localStorage.removeItem(NEARBY_SECTION_COLLAPSED_KEY);
      }
    } catch {
      // ignore storage errors
    }
    set({ nearbySectionCollapsed: next });
  },

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
