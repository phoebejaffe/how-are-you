import { describe, expect, it } from "vitest";
import { personMatchesSearch } from "./peopleSearch";
import type { Person, PersonBundle } from "../types";

const person: Person = {
  nameKey: "Alex",
  displayName: "Alex Kim",
  createdAtIso: "",
  updatedAtIso: "",
};

const bundle: PersonBundle = {
  person,
  topics: [
    {
      id: "t1",
      personNameKey: "Alex",
      text: "new job in Portland",
      status: "active",
      pinned: false,
      sortOrder: 0,
      createdAtIso: "",
      channel: "text",
    },
  ],
  followUps: [
    {
      id: "f1",
      topicId: "t1",
      text: "ask about the move",
      recordedAtIso: "",
      channel: "call",
    },
  ],
  facts: [
    {
      id: "fact1",
      personNameKey: "Alex",
      text: "allergic to cats",
      pinned: false,
      recordedAtIso: "",
      channel: "text",
    },
  ],
  factFolders: [],
  topicFolders: [],
};

describe("personMatchesSearch", () => {
  it("matches display name", () => {
    expect(personMatchesSearch(person, bundle, "alex")).toBe(true);
  });

  it("matches topic text", () => {
    expect(personMatchesSearch(person, undefined, "portland")).toBe(false);
    expect(personMatchesSearch(person, bundle, "portland")).toBe(true);
  });

  it("matches fact text", () => {
    expect(personMatchesSearch(person, bundle, "cats")).toBe(true);
  });

  it("matches follow-up text", () => {
    expect(personMatchesSearch(person, bundle, "move")).toBe(true);
  });

  it("returns true for empty query", () => {
    expect(personMatchesSearch(person, bundle, "  ")).toBe(true);
  });
});
