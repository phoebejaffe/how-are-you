import { describe, expect, it } from "vitest";
import { computeTimeCluster, isWithinTimeCluster } from "./timeCluster";
import type { PersonBundle } from "../types";

const bundle: PersonBundle = {
  person: {
    nameKey: "Alex",
    displayName: "Alex",
    createdAtIso: "2026-01-01T00:00:00.000Z",
    updatedAtIso: "2026-01-01T00:00:00.000Z",
  },
  topics: [
    {
      id: "t1",
      personNameKey: "Alex",
      text: "Topic A",
      status: "active",
      pinned: false,
      sortOrder: 0,
      createdAtIso: "2026-06-05T12:00:00.000Z",
      channel: "call",
    },
    {
      id: "t2",
      personNameKey: "Alex",
      text: "Topic B",
      status: "active",
      pinned: false,
      sortOrder: 1,
      createdAtIso: "2026-06-05T18:00:00.000Z",
      channel: "text",
    },
  ],
  followUps: [
    {
      id: "f1",
      topicId: "t1",
      text: "Follow-up A",
      recordedAtIso: "2026-06-05T13:00:00.000Z",
      channel: "call",
    },
  ],
  facts: [],
  factFolders: [],
  topicFolders: [],
};

describe("timeCluster", () => {
  it("includes entries within two hours of the anchor", () => {
    expect(isWithinTimeCluster("2026-06-05T12:00:00.000Z", "2026-06-05T13:59:00.000Z")).toBe(true);
    expect(isWithinTimeCluster("2026-06-05T12:00:00.000Z", "2026-06-05T14:01:00.000Z")).toBe(false);
  });

  it("clusters topics and follow-ups around an anchor", () => {
    const cluster = computeTimeCluster(bundle, "2026-06-05T12:00:00.000Z", new Set());
    expect(cluster.topicIds).toEqual(new Set(["t1"]));
    expect(cluster.followUpIds).toEqual(new Set(["f1"]));
  });

  it("excludes topics outside the window and pending deletes", () => {
    const cluster = computeTimeCluster(bundle, "2026-06-05T12:00:00.000Z", new Set(["t1"]));
    expect(cluster.topicIds.size).toBe(0);
    expect(cluster.followUpIds).toEqual(new Set(["f1"]));
  });
});
