import type { Fact, FactFolder } from "../types";

export function sortFactFolders(folders: FactFolder[]): FactFolder[] {
  return [...folders].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function groupUnpinnedFacts(
  facts: Fact[],
  folders: FactFolder[],
): { folders: { folder: FactFolder; facts: Fact[] }[]; unsorted: Fact[] } {
  const folderIds = new Set(folders.map((f) => f.id));
  const unsorted: Fact[] = [];
  const byFolder = new Map<string, Fact[]>(folders.map((f) => [f.id, []]));

  for (const fact of facts) {
    if (!fact.folderId || !folderIds.has(fact.folderId)) {
      unsorted.push(fact);
      continue;
    }
    byFolder.get(fact.folderId)!.push(fact);
  }

  return {
    folders: sortFactFolders(folders).map((folder) => ({
      folder,
      facts: byFolder.get(folder.id) ?? [],
    })),
    unsorted,
  };
}

export const UNSORTED_DROP_ID = "unsorted";

export const FACT_DRAG_MIME = "application/x-how-are-you-fact-id";

export const FOLDER_DRAG_MIME = "application/x-how-are-you-folder-id";

export function reorderFactFolders(
  folders: FactFolder[],
  draggedId: string,
  targetId: string,
): FactFolder[] {
  if (draggedId === targetId) return folders;

  const sorted = sortFactFolders(folders);
  const fromIndex = sorted.findIndex((f) => f.id === draggedId);
  const toIndex = sorted.findIndex((f) => f.id === targetId);
  if (fromIndex < 0 || toIndex < 0) return folders;

  const next = [...sorted];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next.map((folder, index) => ({ ...folder, sortOrder: index }));
}
