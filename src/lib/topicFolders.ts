import type { Topic, TopicFolder } from "../types";
import {
  foldersFromLayoutOrder,
  groupByFolder,
  loadLayoutOrder,
  moveUnsortedToEnd,
  reorderLayoutItems,
  resolveLayoutOrder,
  saveLayoutOrder,
  sortFolders,
  UNSORTED_DROP_ID,
} from "./folders";

export { UNSORTED_DROP_ID, reorderLayoutItems, moveUnsortedToEnd, foldersFromLayoutOrder };

const TOPICS_LAYOUT_STORAGE_KEY = "how-are-you-topics-layout";

export function sortTopicFolders(folders: TopicFolder[]): TopicFolder[] {
  return sortFolders(folders);
}

export function groupUnpinnedTopics(
  topics: Topic[],
  folders: TopicFolder[],
): { folders: { folder: TopicFolder; topics: Topic[] }[]; unsorted: Topic[] } {
  const grouped = groupByFolder(topics, folders);
  return {
    folders: grouped.folders.map(({ folder, items }) => ({ folder, topics: items })),
    unsorted: grouped.unsorted,
  };
}

export function topicsLayoutStorageKey(personKey: string): string {
  return `${TOPICS_LAYOUT_STORAGE_KEY}-${personKey}`;
}

export function loadTopicsLayoutOrder(personKey: string): string[] | null {
  return loadLayoutOrder(topicsLayoutStorageKey(personKey));
}

export function saveTopicsLayoutOrder(personKey: string, order: string[]): void {
  saveLayoutOrder(topicsLayoutStorageKey(personKey), order);
}

export function resolveTopicsLayoutOrder(personKey: string, folders: TopicFolder[]): string[] {
  const folderIds = sortTopicFolders(folders).map((f) => f.id);
  return resolveLayoutOrder(topicsLayoutStorageKey(personKey), folderIds);
}
