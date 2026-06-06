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

function factsLayoutStorageKey(personKey: string): string {
  return `how-are-you-facts-layout-${personKey}`;
}

export function loadFactsLayoutOrder(personKey: string): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(factsLayoutStorageKey(personKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveFactsLayoutOrder(personKey: string, order: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(factsLayoutStorageKey(personKey), JSON.stringify(order));
  } catch {
    // quota / private mode
  }
}

export function resolveFactsLayoutOrder(personKey: string, folders: FactFolder[]): string[] {
  const folderIds = sortFactFolders(folders).map((f) => f.id);
  const stored = loadFactsLayoutOrder(personKey) ?? [];
  const order: string[] = [];
  const seen = new Set<string>();

  for (const id of stored) {
    if (id === UNSORTED_DROP_ID || folderIds.includes(id)) {
      if (!seen.has(id)) {
        order.push(id);
        seen.add(id);
      }
    }
  }

  for (const id of folderIds) {
    if (!seen.has(id)) {
      order.push(id);
      seen.add(id);
    }
  }

  if (!seen.has(UNSORTED_DROP_ID)) {
    order.push(UNSORTED_DROP_ID);
  }

  return order;
}

export function reorderLayoutItems(order: string[], draggedId: string, targetId: string): string[] {
  if (draggedId === targetId) return order;

  const fromIndex = order.indexOf(draggedId);
  const toIndex = order.indexOf(targetId);
  if (fromIndex < 0 || toIndex < 0) return order;

  const next = [...order];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}

export function moveUnsortedToEnd(order: string[]): string[] {
  const without = order.filter((id) => id !== UNSORTED_DROP_ID);
  return [...without, UNSORTED_DROP_ID];
}

export function foldersFromLayoutOrder(folders: FactFolder[], layoutOrder: string[]): FactFolder[] {
  const folderMap = new Map(folders.map((f) => [f.id, f]));
  return layoutOrder
    .filter((id) => id !== UNSORTED_DROP_ID)
    .map((id, index) => {
      const folder = folderMap.get(id);
      return folder ? { ...folder, sortOrder: index } : null;
    })
    .filter((folder): folder is FactFolder => folder !== null);
}
