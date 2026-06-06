import type { Topic } from "../types";
import { assignSortOrdersInGroups, itemsAfterReorderInGroup, nextSortOrderInGroup, sortBySortOrder } from "./itemOrder";

export function folderKeyForTopic(topic: Topic): string {
  if (topic.pinned) return "pinned";
  return topic.folderId ?? "unsorted";
}

export function sortActiveTopics(topics: Topic[]): Topic[] {
  return sortBySortOrder(
    topics.filter((t) => t.status === "active"),
    (a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.createdAtIso.localeCompare(b.createdAtIso);
    },
  );
}

export function sortPinnedTopics(topics: Topic[]): Topic[] {
  return sortBySortOrder(
    topics.filter((t) => t.status === "active" && t.pinned),
    (a, b) => a.createdAtIso.localeCompare(b.createdAtIso),
  );
}

export function sortUnpinnedTopics(topics: Topic[]): Topic[] {
  return sortBySortOrder(
    topics.filter((t) => t.status === "active" && !t.pinned),
    (a, b) => a.createdAtIso.localeCompare(b.createdAtIso),
  );
}

export function sortArchivedTopics(topics: Topic[]): Topic[] {
  return sortBySortOrder(
    topics.filter((t) => t.status === "archived"),
    (a, b) => a.createdAtIso.localeCompare(b.createdAtIso),
  );
}

export function sortTopicsInFolder(topics: Topic[], folderId: string | null): Topic[] {
  return sortBySortOrder(
    topics.filter((t) => t.status === "active" && !t.pinned && (t.folderId ?? null) === folderId),
    (a, b) => a.createdAtIso.localeCompare(b.createdAtIso),
  );
}

export function nextSortOrderForTopic(
  topics: Topic[],
  opts: { pinned: boolean; folderId?: string | null },
): number {
  const folderId = opts.folderId ?? null;
  return nextSortOrderInGroup(
    topics.filter((t) => t.status === "active"),
    (t) => t.pinned === opts.pinned && (t.folderId ?? null) === folderId,
  );
}

export function topicsAfterReorder(
  topics: Topic[],
  draggedId: string,
  targetId: string,
): Topic[] | null {
  const dragged = topics.find((t) => t.id === draggedId);
  const target = topics.find((t) => t.id === targetId);
  if (!dragged || !target || dragged.pinned !== target.pinned) return null;
  if (!dragged.pinned && (dragged.folderId ?? null) !== (target.folderId ?? null)) return null;

  return itemsAfterReorderInGroup(
    topics.filter((t) => t.status === "active"),
    draggedId,
    targetId,
    (t) => {
      if (t.pinned !== dragged.pinned) return false;
      if (t.pinned) return true;
      return (t.folderId ?? null) === (dragged.folderId ?? null);
    },
  );
}

export function pinnedTopicsAfterReorder(
  topics: Topic[],
  draggedId: string,
  targetId: string,
): Topic[] | null {
  const activePinned = topics.filter((t) => t.status === "active" && t.pinned);
  const dragged = activePinned.find((t) => t.id === draggedId);
  const target = activePinned.find((t) => t.id === targetId);
  if (!dragged || !target) return null;
  return itemsAfterReorderInGroup(activePinned, draggedId, targetId, () => true);
}

export function withTopicSortOrders(topics: Topic[]): Topic[] {
  const active = topics.filter((t) => t.status === "active");
  const orderMap = assignSortOrdersInGroups(active, folderKeyForTopic, (a, b) =>
    a.createdAtIso.localeCompare(b.createdAtIso),
  );
  return topics.map((topic) => {
    if (topic.status !== "active") return topic;
    const sortOrder = orderMap.get(topic.id);
    if (sortOrder === undefined || topic.sortOrder === sortOrder) return topic;
    return { ...topic, sortOrder };
  });
}
