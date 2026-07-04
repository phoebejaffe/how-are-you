import { describe, expect, it } from "vitest";
import type { Person } from "../types";
import { collectMapLocationPins } from "./mapLocations";

const person = (overrides: Partial<Person> & Pick<Person, "nameKey" | "displayName">): Person => ({
  createdAtIso: "2024-01-01",
  updatedAtIso: "2024-01-01",
  ...overrides,
});

describe("collectMapLocationPins", () => {
  it("collects geocoded locations only", () => {
    const pins = collectMapLocationPins([
      person({
        nameKey: "alex",
        displayName: "Alex",
        locations: [
          { id: "1", label: "Works", name: "Office", latitude: 40.75, longitude: -73.99 },
          { id: "2", label: "Met", name: "Cafe" },
        ],
      }),
    ]);

    expect(pins).toHaveLength(1);
    expect(pins[0]).toMatchObject({
      personNameKey: "alex",
      personDisplayName: "Alex",
      label: "Works",
      placeName: "Office",
      latitude: 40.75,
      longitude: -73.99,
    });
  });

  it("includes legacy met/work locations without coordinates", () => {
    expect(
      collectMapLocationPins([
        person({ nameKey: "sam", displayName: "Sam", metLocation: "Portland" }),
      ]),
    ).toEqual([]);
  });
});
