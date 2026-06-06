import { reorderLayoutItems } from "./folders";
import type { Topic } from "../types";

export function sortActiveTopics(topics: Topic[]): Topic[] {
  return [...topics].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const order = a.sortOrder - b.sortOrder;
    if (order !== 0) return order;
    return a.createdAtIso.localeCompare(b.createdAtIso);
  });
}

export function nextSortOrderForTopic(topics: Topic[], pinned: boolean): number {
  const group = topics.filter((t) => t.status === "active" && t.pinned === pinned);
  return group.reduce((max, t) => Math.max(max, t.sortOrder), -1) + 1;
}

/** Reorder within the same pin group (pinned or unpinned). Returns topics to persist, or null if invalid. */
export function topicsAfterReorder(
  topics: Topic[],
  draggedId: string,
  targetId: string,
): Topic[] | null {
  const active = topics.filter((t) => t.status === "active");
  const sorted = sortActiveTopics(active);
  const dragged = sorted.find((t) => t.id === draggedId);
  const target = sorted.find((t) => t.id === targetId);
  if (!dragged || !target || dragged.pinned !== target.pinned) return null;

  const nextOrder = reorderLayoutItems(
    sorted.map((t) => t.id),
    draggedId,
    targetId,
  );
  const topicMap = new Map(sorted.map((t) => [t.id, t]));

  const toSave: Topic[] = [];
  nextOrder.forEach((id, index) => {
    const topic = topicMap.get(id);
    if (topic && topic.sortOrder !== index) {
      toSave.push({ ...topic, sortOrder: index });
    }
  });
  return toSave.length > 0 ? toSave : null;
}

/** Assign sortOrder by pin tier + createdAt when missing (legacy data). */
export function withTopicSortOrders(topics: Topic[]): Topic[] {
  const byPerson = new Map<string, Topic[]>();
  for (const topic of topics) {
    const list = byPerson.get(topic.personNameKey) ?? [];
    list.push(topic);
    byPerson.set(topic.personNameKey, list);
  }

  const result: Topic[] = [];
  for (const personTopics of byPerson.values()) {
    const active = personTopics.filter((t) => t.status === "active");
    const hasSortOrder = active.length === 0 || active.every((t) => typeof t.sortOrder === "number" && !Number.isNaN(t.sortOrder));
    if (hasSortOrder) {
      result.push(...personTopics);
      continue;
    }

    const sorted = [...active].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.createdAtIso.localeCompare(b.createdAtIso);
    });
    const orderMap = new Map(sorted.map((t, i) => [t.id, i]));
    for (const topic of personTopics) {
      if (topic.status !== "active") {
        result.push(topic);
      } else {
        result.push({ ...topic, sortOrder: orderMap.get(topic.id) ?? 0 });
      }
    }
  }
  return result;
}
