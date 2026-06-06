import { reorderLayoutItems } from "./folders";

export function sortBySortOrder<T extends { sortOrder?: number }>(
  items: T[],
  fallback: (a: T, b: T) => number = () => 0,
): T[] {
  return [...items].sort((a, b) => {
    const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return fallback(a, b);
  });
}

export function nextSortOrderInGroup<T extends { sortOrder?: number }>(
  items: T[],
  inGroup: (item: T) => boolean,
): number {
  return items.filter(inGroup).reduce((max, item) => Math.max(max, item.sortOrder ?? -1), -1) + 1;
}

/** Reorder within a filtered group. Returns items to persist, or null if invalid. */
export function itemsAfterReorderInGroup<T extends { id: string; sortOrder?: number }>(
  items: T[],
  draggedId: string,
  targetId: string,
  inGroup: (item: T) => boolean,
): T[] | null {
  const group = sortBySortOrder(items.filter(inGroup));
  const dragged = group.find((item) => item.id === draggedId);
  const target = group.find((item) => item.id === targetId);
  if (!dragged || !target) return null;

  const nextOrder = reorderLayoutItems(
    group.map((item) => item.id),
    draggedId,
    targetId,
  );
  const itemMap = new Map(group.map((item) => [item.id, item]));

  const toSave: T[] = [];
  nextOrder.forEach((id, index) => {
    const item = itemMap.get(id);
    if (item && item.sortOrder !== index) {
      toSave.push({ ...item, sortOrder: index });
    }
  });
  return toSave.length > 0 ? toSave : null;
}

export function assignSortOrdersInGroups<T extends { sortOrder?: number }>(
  items: T[],
  groupKey: (item: T) => string,
  fallbackSort: (a: T, b: T) => number,
  getId: (item: T) => string = (item) => (item as unknown as { id: string }).id,
): Map<string, number> {
  const byGroup = new Map<string, T[]>();
  for (const item of items) {
    const key = groupKey(item);
    const list = byGroup.get(key) ?? [];
    list.push(item);
    byGroup.set(key, list);
  }

  const orderMap = new Map<string, number>();
  for (const groupItems of byGroup.values()) {
    const sorted = [...groupItems].sort((a, b) => {
      const aHas = typeof a.sortOrder === "number" && !Number.isNaN(a.sortOrder);
      const bHas = typeof b.sortOrder === "number" && !Number.isNaN(b.sortOrder);
      if (aHas && bHas && a.sortOrder !== b.sortOrder) return a.sortOrder! - b.sortOrder!;
      if (aHas !== bHas) return aHas ? -1 : 1;
      return fallbackSort(a, b);
    });
    sorted.forEach((item, index) => orderMap.set(getId(item), index));
  }
  return orderMap;
}
