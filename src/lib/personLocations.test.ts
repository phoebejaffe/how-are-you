import { describe, expect, it } from "vitest";
import { mergePersonLocations, normalizePersonLocations, sanitizePersonLocations } from "./personLocations";

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
