import { describe, expect, it } from "vitest";
import { validateRename } from "./personRename";
import type { Person } from "../types";

const people: Person[] = [
  { nameKey: "Alex Kim", displayName: "Alex Kim", createdAtIso: "", updatedAtIso: "" },
  { nameKey: "Blair Lee", displayName: "Blair Lee", createdAtIso: "", updatedAtIso: "" },
];

describe("validateRename", () => {
  it("rejects empty names", () => {
    expect(validateRename(people, "Alex Kim", "   ")).toEqual({
      ok: false,
      error: "Name cannot be empty.",
    });
  });

  it("rejects duplicate names", () => {
    expect(validateRename(people, "Alex Kim", "Blair Lee")).toEqual({
      ok: false,
      error: 'Someone named "Blair Lee" already exists.',
    });
  });

  it("rejects duplicate names case-insensitively", () => {
    expect(validateRename(people, "Alex Kim", "blair lee")).toEqual({
      ok: false,
      error: 'Someone named "blair lee" already exists.',
    });
  });

  it("accepts valid rename", () => {
    expect(validateRename(people, "Alex Kim", "Alex K.")).toEqual({
      ok: true,
      newKey: "Alex K.",
    });
  });
});
