export const UNSORTED_DROP_ID = "unsorted";

export interface BaseFolder {
  id: string;
  name: string;
  collapsed: boolean;
  sortOrder: number;
}

export function sortFolders<T extends { sortOrder: number; name: string }>(folders: T[]): T[] {
  return [...folders].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

function sortGroupedItems<T extends { sortOrder?: number }>(
  items: T[],
  getId: (item: T) => string,
): T[] {
  return [...items].sort((a, b) => {
    const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return getId(a).localeCompare(getId(b));
  });
}

export function groupByFolder<
  T extends { folderId?: string; sortOrder?: number },
  F extends { id: string; sortOrder: number; name: string },
>(
  items: T[],
  folders: F[],
  getId: (item: T) => string = (item) => (item as unknown as { id: string }).id,
): { folders: { folder: F; items: T[] }[]; unsorted: T[] } {
  const folderIds = new Set(folders.map((f) => f.id));
  const unsorted: T[] = [];
  const byFolder = new Map<string, T[]>(folders.map((f) => [f.id, []]));

  for (const item of items) {
    if (!item.folderId || !folderIds.has(item.folderId)) {
      unsorted.push(item);
      continue;
    }
    byFolder.get(item.folderId)!.push(item);
  }

  return {
    folders: sortFolders(folders).map((folder) => ({
      folder,
      items: sortGroupedItems(byFolder.get(folder.id) ?? [], getId),
    })),
    unsorted: sortGroupedItems(unsorted, getId),
  };
}

export function loadLayoutOrder(storageKey: string): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLayoutOrder(storageKey: string, order: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(order));
  } catch {
    // quota / private mode
  }
}

export function resolveLayoutOrder(storageKey: string, folderIds: string[]): string[] {
  const stored = loadLayoutOrder(storageKey) ?? [];
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

export function foldersFromLayoutOrder<T extends BaseFolder>(folders: T[], layoutOrder: string[]): T[] {
  const folderMap = new Map(folders.map((f) => [f.id, f]));
  return layoutOrder
    .filter((id) => id !== UNSORTED_DROP_ID)
    .map((id, index) => {
      const folder = folderMap.get(id);
      return folder ? { ...folder, sortOrder: index } : null;
    })
    .filter((folder): folder is T => folder !== null);
}
