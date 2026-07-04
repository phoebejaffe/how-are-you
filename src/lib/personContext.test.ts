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
  it("shows context before location", () => {
    expect(
      personListSubtitles({
        ...person,
        context: "the juggler",
        locations: [{ id: "1", label: "Met", name: "Portland" }],
      }),
    ).toEqual(["the juggler", "Portland"]);
  });

  it("shows only context when no location", () => {
    expect(personListSubtitles({ ...person, context: "the tall brother" })).toEqual([
      "the tall brother",
    ]);
  });
});
