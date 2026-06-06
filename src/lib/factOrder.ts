import type { Fact } from "../types";
import { assignSortOrdersInGroups, itemsAfterReorderInGroup, nextSortOrderInGroup, sortBySortOrder } from "./itemOrder";

export function folderKeyForFact(fact: Fact): string {
  if (fact.pinned) return "pinned";
  return fact.folderId ?? "unsorted";
}

export function sortPinnedFacts(facts: Fact[]): Fact[] {
  return sortBySortOrder(
    facts.filter((f) => f.pinned),
    (a, b) => a.recordedAtIso.localeCompare(b.recordedAtIso),
  );
}

export function sortFactsInFolder(facts: Fact[], folderId: string | null): Fact[] {
  return sortBySortOrder(
    facts.filter((f) => !f.pinned && (f.folderId ?? null) === folderId),
    (a, b) => a.recordedAtIso.localeCompare(b.recordedAtIso),
  );
}

export function nextSortOrderForFact(facts: Fact[], opts: { pinned: boolean; folderId?: string | null }): number {
  const folderId = opts.folderId ?? null;
  return nextSortOrderInGroup(
    facts,
    (f) => f.pinned === opts.pinned && (f.folderId ?? null) === folderId,
  );
}

export function factsAfterReorder(facts: Fact[], draggedId: string, targetId: string): Fact[] | null {
  const dragged = facts.find((f) => f.id === draggedId);
  const target = facts.find((f) => f.id === targetId);
  if (!dragged || !target || dragged.pinned !== target.pinned) return null;
  if (!dragged.pinned && (dragged.folderId ?? null) !== (target.folderId ?? null)) return null;

  return itemsAfterReorderInGroup(facts, draggedId, targetId, (f) => {
    if (f.pinned !== dragged.pinned) return false;
    if (f.pinned) return true;
    return (f.folderId ?? null) === (dragged.folderId ?? null);
  });
}

export function withFactSortOrders(facts: Fact[]): Fact[] {
  const orderMap = assignSortOrdersInGroups(facts, folderKeyForFact, (a, b) =>
    a.recordedAtIso.localeCompare(b.recordedAtIso),
  );
  return facts.map((fact) => {
    const sortOrder = orderMap.get(fact.id);
    if (sortOrder === undefined || fact.sortOrder === sortOrder) return fact;
    return { ...fact, sortOrder };
  });
}
