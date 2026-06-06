import type { Fact, FactFolder } from "../types";
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

const FACTS_LAYOUT_STORAGE_KEY = "how-are-you-facts-layout";

export function sortFactFolders(folders: FactFolder[]): FactFolder[] {
  return sortFolders(folders);
}

export function groupUnpinnedFacts(
  facts: Fact[],
  folders: FactFolder[],
): { folders: { folder: FactFolder; facts: Fact[] }[]; unsorted: Fact[] } {
  const grouped = groupByFolder(facts, folders);
  return {
    folders: grouped.folders.map(({ folder, items }) => ({ folder, facts: items })),
    unsorted: grouped.unsorted,
  };
}

function factsLayoutStorageKey(personKey: string): string {
  return `${FACTS_LAYOUT_STORAGE_KEY}-${personKey}`;
}

export function loadFactsLayoutOrder(personKey: string): string[] | null {
  return loadLayoutOrder(factsLayoutStorageKey(personKey));
}

export function saveFactsLayoutOrder(personKey: string, order: string[]): void {
  saveLayoutOrder(factsLayoutStorageKey(personKey), order);
}

export function resolveFactsLayoutOrder(personKey: string, folders: FactFolder[]): string[] {
  const folderIds = sortFactFolders(folders).map((f) => f.id);
  return resolveLayoutOrder(factsLayoutStorageKey(personKey), folderIds);
}
