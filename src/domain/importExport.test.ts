import { describe, expect, it } from "vitest";
import {
  buildExportPayload,
  findImportConflicts,
  mergePersonBundles,
  parseExportPayload,
} from "./importExport";
import type { PersonBundle } from "../types";

function makeBundle(name: string, topicId = "t1"): PersonBundle {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    person: { nameKey: name, displayName: name, createdAtIso: now, updatedAtIso: now },
    topics: [
      {
        id: topicId,
        personNameKey: name,
        text: "How is work?",
        status: "active",
        pinned: false,
        createdAtIso: now,
        channel: "call",
      },
    ],
    followUps: [],
    facts: [],
    factFolders: [],
  };
}

describe("importExport", () => {
  it("builds export payload with schema version", () => {
    const bundle = makeBundle("Alex");
    const payload = buildExportPayload([bundle], ["Alex"]);
    expect(payload.schemaVersion).toBe(1);
    expect(payload.people).toHaveLength(1);
    expect(payload.exportedAtIso).toBeTruthy();
  });

  it("parses valid export payload", () => {
    const bundle = makeBundle("Alex");
    const payload = buildExportPayload([bundle], ["Alex"]);
    const parsed = parseExportPayload(payload);
    expect(parsed.people[0].person.displayName).toBe("Alex");
  });

  it("finds import conflicts by name key", () => {
    const existing = [makeBundle("Alex")];
    const imported = [makeBundle("Alex", "t2"), makeBundle("Blair")];
    const conflicts = findImportConflicts(imported, existing);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].imported.person.nameKey).toBe("Alex");
  });

  it("merges bundles and remaps colliding ids", () => {
    const existing = makeBundle("Alex", "shared-id");
    const imported = makeBundle("Alex", "shared-id");
    imported.topics[0].text = "New topic";
    const merged = mergePersonBundles(existing, imported);
    expect(merged.topics).toHaveLength(2);
    const ids = merged.topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });
});
