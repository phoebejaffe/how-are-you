import type { Person, PeopleFolder } from "../types";
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

const PEOPLE_LAYOUT_STORAGE_KEY = "how-are-you-people-layout";

export function sortPeopleFolders(folders: PeopleFolder[]): PeopleFolder[] {
  return sortFolders(folders);
}

export function groupPeople(
  people: Person[],
  folders: PeopleFolder[],
): { folders: { folder: PeopleFolder; people: Person[] }[]; unsorted: Person[] } {
  const grouped = groupByFolder(people, folders);
  return {
    folders: grouped.folders.map(({ folder, items }) => ({ folder, people: items })),
    unsorted: grouped.unsorted,
  };
}

export function loadPeopleLayoutOrder(): string[] | null {
  return loadLayoutOrder(PEOPLE_LAYOUT_STORAGE_KEY);
}

export function savePeopleLayoutOrder(order: string[]): void {
  saveLayoutOrder(PEOPLE_LAYOUT_STORAGE_KEY, order);
}

export function resolvePeopleLayoutOrder(folders: PeopleFolder[]): string[] {
  const folderIds = sortPeopleFolders(folders).map((f) => f.id);
  return resolveLayoutOrder(PEOPLE_LAYOUT_STORAGE_KEY, folderIds);
}
