import { describe, expect, it } from "vitest";
import {
  buildExportPayload,
  findImportConflicts,
  mergePeopleFoldersByName,
  mergePersonBundles,
  parseExportPayload,
  parseExportText,
  remapPersonBundlePeopleFolder,
  serializeExportPayload,
} from "./importExport";
import type { PersonBundle, PeopleFolder } from "../types";

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
        sortOrder: 0,
        createdAtIso: now,
        channel: "call",
      },
    ],
    followUps: [],
    facts: [],
    factFolders: [],
    topicFolders: [],
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

  it("parses export text and rejects empty input", () => {
    const bundle = makeBundle("Alex");
    const text = serializeExportPayload(buildExportPayload([bundle], ["Alex"]));
    expect(parseExportText(text).people).toHaveLength(1);
    expect(() => parseExportText("   ")).toThrow("Paste export JSON");
    expect(() => parseExportText("{")).toThrow("Invalid JSON");
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

  it("merges people folders by name and remaps imported folder ids", () => {
    const existing: PeopleFolder[] = [
      { id: "folder-work", name: "Work", collapsed: false, sortOrder: 0 },
    ];
    const imported: PeopleFolder[] = [
      { id: "import-work", name: "work", collapsed: true, sortOrder: 0 },
      { id: "import-friends", name: "Friends", collapsed: false, sortOrder: 1 },
    ];

    const { foldersToSave, folderIdMap } = mergePeopleFoldersByName(existing, imported);
    expect(foldersToSave).toHaveLength(1);
    expect(foldersToSave[0].name).toBe("Friends");
    expect(folderIdMap.get("import-work")).toBe("folder-work");
    expect(folderIdMap.get("import-friends")).toBe(foldersToSave[0].id);

    const bundle = makeBundle("Blair");
    bundle.person.folderId = "import-work";
    const remapped = remapPersonBundlePeopleFolder(bundle, folderIdMap);
    expect(remapped.person.folderId).toBe("folder-work");
  });
});
