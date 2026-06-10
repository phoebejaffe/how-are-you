import { describe, expect, it } from "vitest";
import type { Person } from "../types";
import { findPersonKey, personNameKey, personNameKeysMatch } from "./ids";

describe("personNameKey", () => {
  it("trims whitespace", () => {
    expect(personNameKey("  Alex  ")).toBe("Alex");
  });
});

describe("personNameKeysMatch", () => {
  it("matches names case-insensitively", () => {
    expect(personNameKeysMatch("Alex", "alex")).toBe(true);
    expect(personNameKeysMatch("Alex Kim", "alex kim")).toBe(true);
  });

  it("does not match different names", () => {
    expect(personNameKeysMatch("Alex", "Blair")).toBe(false);
  });
});

describe("findPersonKey", () => {
  const people: Person[] = [
    { nameKey: "Alex", displayName: "Alex", createdAtIso: "", updatedAtIso: "" },
    { nameKey: "Blair", displayName: "Blair", createdAtIso: "", updatedAtIso: "" },
  ];

  it("finds exact key", () => {
    expect(findPersonKey(people, "Alex")).toBe("Alex");
  });

  it("finds key case-insensitively", () => {
    expect(findPersonKey(people, "alex")).toBe("Alex");
  });

  it("returns null when not found", () => {
    expect(findPersonKey(people, "Sam")).toBeNull();
  });
});
