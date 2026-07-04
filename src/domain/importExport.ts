import { createId } from "../lib/ids";
import { mergeImportantDates, normalizePersonImportantDates } from "../lib/personImportantDates";
import { mergePersonContext, normalizePersonContext } from "../lib/personContext";
import { mergePersonLocations, normalizePersonLocations } from "../lib/personLocations";
import type {
  ExportPayload,
  ImportConflict,
  ImportConflictResolution,
  PeopleFolder,
  PersonBundle,
} from "../types";

export const EXPORT_SCHEMA_VERSION = 1 as const;

export function buildExportPayload(
  bundles: PersonBundle[],
  selectedKeys: string[],
  peopleFolders: PeopleFolder[] = [],
): ExportPayload {
  const keySet = new Set(selectedKeys);
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAtIso: new Date().toISOString(),
    people: bundles.filter((b) => keySet.has(b.person.nameKey)),
    peopleFolders,
  };
}

export function serializeExportPayload(payload: ExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function exportFilename(date = new Date()): string {
  return `how-are-you-export-${date.toISOString().slice(0, 10)}.json`;
}

export function parseExportText(text: string): ExportPayload {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Paste export JSON or choose a file.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(trimmed);
  } catch {
    throw new Error("Invalid JSON.");
  }

  return parseExportPayload(raw);
}

export function parseExportPayload(raw: unknown): ExportPayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid export file.");
  }
  const payload = raw as Partial<ExportPayload>;
  if (payload.schemaVersion !== EXPORT_SCHEMA_VERSION) {
    throw new Error(`Unsupported export version: ${String(payload.schemaVersion)}`);
  }
  if (!Array.isArray(payload.people)) {
    throw new Error("Export file is missing people.");
  }
  return payload as ExportPayload;
}

export function findImportConflicts(
  importedPeople: PersonBundle[],
  existingBundles: PersonBundle[],
): ImportConflict[] {
  const existingByKey = new Map(existingBundles.map((b) => [b.person.nameKey, b]));
  const conflicts: ImportConflict[] = [];

  for (const imported of importedPeople) {
    const existing = existingByKey.get(imported.person.nameKey);
    if (existing) {
      conflicts.push({ imported, existing });
    }
  }
  return conflicts;
}

function normalizePeopleFolderName(name: string): string {
  return name.trim().toLowerCase();
}

/** Merge imported people folders into existing ones when names match; returns id remap for people. */
export function mergePeopleFoldersByName(
  existing: PeopleFolder[],
  imported: PeopleFolder[],
): { foldersToSave: PeopleFolder[]; folderIdMap: Map<string, string> } {
  const existingByName = new Map<string, PeopleFolder>();
  for (const folder of [...existing].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const key = normalizePeopleFolderName(folder.name);
    if (!existingByName.has(key)) {
      existingByName.set(key, folder);
    }
  }

  const existingIds = new Set(existing.map((folder) => folder.id));
  const folderIdMap = new Map<string, string>();
  const foldersToSave: PeopleFolder[] = [];
  const maxOrder = existing.reduce((max, folder) => Math.max(max, folder.sortOrder), -1);
  let nextOrder = maxOrder + 1;

  for (const importedFolder of imported) {
    const key = normalizePeopleFolderName(importedFolder.name);
    const match = existingByName.get(key);
    if (match) {
      folderIdMap.set(importedFolder.id, match.id);
      continue;
    }

    const pending = foldersToSave.find((folder) => normalizePeopleFolderName(folder.name) === key);
    if (pending) {
      folderIdMap.set(importedFolder.id, pending.id);
      continue;
    }

    let folder: PeopleFolder = {
      ...importedFolder,
      name: importedFolder.name.trim(),
      sortOrder: importedFolder.sortOrder ?? nextOrder++,
    };
    if (existingIds.has(folder.id) || foldersToSave.some((entry) => entry.id === folder.id)) {
      folder = { ...folder, id: createId() };
    }
    foldersToSave.push(folder);
    existingByName.set(key, folder);
    folderIdMap.set(importedFolder.id, folder.id);
  }

  return { foldersToSave, folderIdMap };
}

export function remapPersonBundlePeopleFolder(
  bundle: PersonBundle,
  folderIdMap: Map<string, string>,
): PersonBundle {
  const folderId = bundle.person.folderId;
  if (!folderId) return bundle;
  const remapped = folderIdMap.get(folderId) ?? folderId;
  if (remapped === folderId) return bundle;
  return { ...bundle, person: { ...bundle.person, folderId: remapped } };
}

function remapIds<T extends { id: string }>(items: T[], usedIds: Set<string>): T[] {
  return items.map((item) => {
    if (!usedIds.has(item.id)) {
      usedIds.add(item.id);
      return item;
    }
    const newItem = { ...item, id: createId() };
    usedIds.add(newItem.id);
    return newItem;
  });
}

function remapFolderedItems<T extends { id: string; folderId?: string }>(
  items: T[],
  usedIds: Set<string>,
  folderIdMap: Map<string, string>,
): T[] {
  return remapIds(items, usedIds).map((item) => {
    if (!item.folderId) return item;
    return { ...item, folderId: folderIdMap.get(item.folderId) ?? item.folderId };
  });
}

export function mergePersonBundles(existing: PersonBundle, imported: PersonBundle): PersonBundle {
  const usedIds = new Set<string>([
    ...existing.topics.map((t) => t.id),
    ...existing.followUps.map((f) => f.id),
    ...existing.facts.map((f) => f.id),
    ...(existing.factFolders ?? []).map((f) => f.id),
    ...(existing.topicFolders ?? []).map((f) => f.id),
  ]);

  const importedTopics = remapIds(imported.topics, usedIds);
  const topicIdMap = new Map<string, string>();
  imported.topics.forEach((t, i) => {
    if (t.id !== importedTopics[i].id) {
      topicIdMap.set(t.id, importedTopics[i].id);
    }
  });

  const importedFollowUps = imported.followUps.map((f) => {
    let followUp = f;
    if (usedIds.has(f.id)) {
      followUp = { ...f, id: createId() };
    }
    usedIds.add(followUp.id);
    const remappedTopicId = topicIdMap.get(f.topicId) ?? f.topicId;
    return { ...followUp, topicId: remappedTopicId };
  });

  const importedFactFolders = remapIds(imported.factFolders ?? [], usedIds);
  const factFolderIdMap = new Map<string, string>();
  (imported.factFolders ?? []).forEach((folder, i) => {
    if (folder.id !== importedFactFolders[i].id) {
      factFolderIdMap.set(folder.id, importedFactFolders[i].id);
    }
  });

  const importedTopicFolders = remapIds(imported.topicFolders ?? [], usedIds);
  const topicFolderIdMap = new Map<string, string>();
  (imported.topicFolders ?? []).forEach((folder, i) => {
    if (folder.id !== importedTopicFolders[i].id) {
      topicFolderIdMap.set(folder.id, importedTopicFolders[i].id);
    }
  });

  const importedFacts = remapFolderedItems(imported.facts, usedIds, factFolderIdMap);
  const remappedImportedTopics = remapFolderedItems(importedTopics, usedIds, topicFolderIdMap);

  return {
    person: (() => {
      const existingPerson = normalizePersonContext(
        normalizePersonImportantDates(normalizePersonLocations(existing.person)),
      );
      const importedPerson = normalizePersonContext(
        normalizePersonImportantDates(normalizePersonLocations(imported.person)),
      );
      return {
        ...existingPerson,
        displayName: existing.person.displayName,
        locations: mergePersonLocations(existingPerson.locations, importedPerson.locations),
        importantDates: mergeImportantDates(existingPerson.importantDates, importedPerson.importantDates),
        context: mergePersonContext(existingPerson.context, importedPerson.context),
        updatedAtIso: new Date().toISOString(),
      };
    })(),
    topics: [...existing.topics, ...remappedImportedTopics],
    followUps: [...existing.followUps, ...importedFollowUps],
    facts: [...existing.facts, ...importedFacts],
    factFolders: [...(existing.factFolders ?? []), ...importedFactFolders],
    topicFolders: [...(existing.topicFolders ?? []), ...importedTopicFolders],
  };
}

export function applyImport(
  existingBundles: PersonBundle[],
  importedPeople: PersonBundle[],
  resolutions: Map<string, ImportConflictResolution>,
): PersonBundle[] {
  const resultMap = new Map(existingBundles.map((b) => [b.person.nameKey, b]));

  for (const imported of importedPeople) {
    const key = imported.person.nameKey;
    const existing = resultMap.get(key);
    const resolution = resolutions.get(key);

    if (!existing) {
      resultMap.set(key, {
        ...imported,
        factFolders: imported.factFolders ?? [],
        topicFolders: imported.topicFolders ?? [],
      });
      continue;
    }

    if (resolution === "ignore") continue;
    if (resolution === "override") {
      resultMap.set(key, {
        ...imported,
        factFolders: imported.factFolders ?? [],
        topicFolders: imported.topicFolders ?? [],
      });
      continue;
    }
    if (resolution === "merge") {
      resultMap.set(key, mergePersonBundles(existing, imported));
    }
  }

  return Array.from(resultMap.values()).sort((a, b) =>
    a.person.displayName.localeCompare(b.person.displayName),
  );
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
