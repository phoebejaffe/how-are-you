import { afterEach, describe, expect, it, vi } from "vitest";
import { METERS_PER_FOOT, SEARCH_BIAS_RADIUS_MILES } from "./geo";
import { searchPlaces } from "./geocoding";

const user = { latitude: 40.758, longitude: -73.9855 };

function photonResponse(places: { lat: number; lon: number; name: string }[]) {
  return {
    features: places.map((place) => ({
      geometry: { coordinates: [place.lon, place.lat] },
      properties: { name: place.name },
    })),
  };
}

describe("searchPlaces", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes location bias params when near is provided", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => photonResponse([]),
    } as Response);

    await searchPlaces("cafe", user);

    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("lat=40.758");
    expect(url).toContain("lon=-73.9855");
    expect(url).toContain("location_bias_scale=0.2");
  });

  it("prefers results within 5 miles, sorted by distance", async () => {
    const milesInMeters = SEARCH_BIAS_RADIUS_MILES * 5280 * METERS_PER_FOOT;
    const nearLat = user.latitude + (100 * METERS_PER_FOOT) / 111_000;
    const withinLat = user.latitude + (milesInMeters / 2) / 111_000;
    const outsideLat = user.latitude + (milesInMeters * 1.5) / 111_000;

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () =>
        photonResponse([
          { lat: outsideLat, lon: user.longitude, name: "Far Place" },
          { lat: withinLat, lon: user.longitude, name: "Mid Place" },
          { lat: nearLat, lon: user.longitude, name: "Near Place" },
        ]),
    } as Response);

    const results = await searchPlaces("place", user);

    expect(results.map((place) => place.name)).toEqual(["Near Place", "Mid Place", "Far Place"]);
  });

  it("pads with farther results when fewer than six are within 5 miles", async () => {
    const milesInMeters = SEARCH_BIAS_RADIUS_MILES * 5280 * METERS_PER_FOOT;
    const outsideLat = user.latitude + (milesInMeters * 2) / 111_000;

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () =>
        photonResponse([{ lat: outsideLat, lon: user.longitude, name: "Far Only" }]),
    } as Response);

    const results = await searchPlaces("place", user);

    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Far Only");
  });

  it("limits to 6 results", async () => {
    const places = Array.from({ length: 10 }, (_, index) => ({
      lat: user.latitude + (index * 50 * METERS_PER_FOOT) / 111_000,
      lon: user.longitude,
      name: `Place ${index}`,
    }));

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => photonResponse(places),
    } as Response);

    const results = await searchPlaces("place", user);

    expect(results).toHaveLength(6);
    expect(results.map((place) => place.name)).toEqual([
      "Place 0",
      "Place 1",
      "Place 2",
      "Place 3",
      "Place 4",
      "Place 5",
    ]);
  });
});
