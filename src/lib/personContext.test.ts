import { describe, expect, it } from "vitest";
import type { Person } from "../types";
import {
  mergePersonContext,
  personListSubtitles,
  sanitizePersonContext,
} from "./personContext";

const person: Person = {
  nameKey: "Alex",
  displayName: "Alex",
  createdAtIso: "",
  updatedAtIso: "",
};

describe("sanitizePersonContext", () => {
  it("trims and drops empty values", () => {
    expect(sanitizePersonContext("  the juggler  ")).toBe("the juggler");
    expect(sanitizePersonContext("   ")).toBeUndefined();
    expect(sanitizePersonContext(undefined)).toBeUndefined();
  });
});

describe("mergePersonContext", () => {
  it("prefers existing context over imported", () => {
    expect(mergePersonContext("the tall brother", "the juggler")).toBe("the tall brother");
  });

  it("uses imported when existing is empty", () => {
    expect(mergePersonContext(undefined, "the juggler")).toBe("the juggler");
  });
});

describe("personListSubtitles", () => {
  it("shows context when set", () => {
    expect(
      personListSubtitles({
        ...person,
        context: "the juggler",
        locations: [{ id: "1", label: "Met", name: "Portland" }],
      }),
    ).toEqual(["the juggler"]);
  });

  it("shows place names when there is no context", () => {
    expect(personListSubtitles({ ...person, locations: [{ id: "1", label: "Met", name: "Portland" }] })).toEqual([
      "Portland",
    ]);
  });

  it("returns empty when there is no context or location", () => {
    expect(personListSubtitles(person)).toEqual([]);
  });
});
