import { describe, expect, it } from "vitest";
import { formatDistanceFeet, haversineMeters, METERS_PER_FOOT, NEARBY_RADIUS_FEET } from "./geo";
import { findNearbyPeople, mergePersonLocations, normalizePersonLocations, sanitizePersonLocations } from "./personLocations";
import type { Person } from "../types";

describe("normalizePersonLocations", () => {
  it("migrates legacy met/work fields into locations", () => {
    const person = normalizePersonLocations({
      nameKey: "alex",
      displayName: "Alex",
      createdAtIso: "2024-01-01",
      updatedAtIso: "2024-01-01",
      metLocation: "College",
      workLocation: "Acme",
    });

    expect(person.locations).toEqual([
      expect.objectContaining({ label: "Met", name: "College" }),
      expect.objectContaining({ label: "Works", name: "Acme" }),
    ]);
    expect(person.metLocation).toBeUndefined();
    expect(person.workLocation).toBeUndefined();
  });
});

describe("mergePersonLocations", () => {
  it("adds imported locations without duplicating", () => {
    const merged = mergePersonLocations(
      [{ id: "1", label: "Met", name: "NYC" }],
      [{ id: "2", label: "Works", name: "Acme", latitude: 1, longitude: 2 }],
    );

    expect(merged).toHaveLength(2);
    expect(merged?.[1]).toMatchObject({ label: "Works", latitude: 1, longitude: 2 });
  });
});

describe("sanitizePersonLocations", () => {
  it("drops empty rows and trims values", () => {
    const result = sanitizePersonLocations([
      { id: "1", label: " Met ", name: " NYC " },
      { id: "2", label: "", name: "ignored" },
    ]);

    expect(result).toEqual([expect.objectContaining({ label: "Met", name: "NYC" })]);
  });
});

describe("findNearbyPeople", () => {
  const user = { latitude: 40.758, longitude: -73.9855 };

  const person = (overrides: Partial<Person> & Pick<Person, "nameKey" | "displayName">): Person => ({
    createdAtIso: "2024-01-01",
    updatedAtIso: "2024-01-01",
    ...overrides,
  });

  it("returns people with geocoded locations within 500 feet", () => {
    const nearLat = user.latitude + 100 * METERS_PER_FOOT / 111_000;
    const farLat = user.latitude + 600 * METERS_PER_FOOT / 111_000;

    const matches = findNearbyPeople(
      [
        person({
          nameKey: "alex",
          displayName: "Alex",
          locations: [{ id: "1", label: "Works", name: "Office", latitude: nearLat, longitude: user.longitude }],
        }),
        person({
          nameKey: "sam",
          displayName: "Sam",
          locations: [{ id: "2", label: "Met", name: "Cafe", latitude: farLat, longitude: user.longitude }],
        }),
      ],
      user,
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].person.displayName).toBe("Alex");
    expect(matches[0].distanceFeet).toBeLessThanOrEqual(NEARBY_RADIUS_FEET);
  });

  it("ignores locations without coordinates", () => {
    const matches = findNearbyPeople(
      [person({ nameKey: "alex", displayName: "Alex", locations: [{ id: "1", label: "Met", name: "NYC" }] })],
      user,
    );
    expect(matches).toEqual([]);
  });
});

describe("geo helpers", () => {
  it("computes haversine distance in meters", () => {
    const a = { latitude: 40.758, longitude: -73.9855 };
    const b = { latitude: 40.759, longitude: -73.9855 };
    expect(haversineMeters(a, b)).toBeGreaterThan(0);
    expect(haversineMeters(a, b)).toBeLessThan(200);
  });

  it("formats distance in feet", () => {
    expect(formatDistanceFeet(30)).toBe("nearby");
    expect(formatDistanceFeet(120)).toBe("120 ft");
  });
});
