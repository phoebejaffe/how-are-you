import type { Person } from "../types";
import { reorderLayoutItems } from "./folders";
import { assignSortOrdersInGroups, nextSortOrderInGroup, sortBySortOrder } from "./itemOrder";

export function folderKeyForPerson(person: Person): string {
  return person.folderId ?? "unsorted";
}

export function sortPeopleInFolder(people: Person[], folderId: string | null): Person[] {
  return sortBySortOrder(
    people.filter((p) => (p.folderId ?? null) === folderId),
    (a, b) => {
      const aTime = a.lastActivityAtIso ?? "";
      const bTime = b.lastActivityAtIso ?? "";
      if (aTime !== bTime) return bTime.localeCompare(aTime);
      return a.displayName.localeCompare(b.displayName);
    },
  );
}

export function nextSortOrderForPerson(people: Person[], folderId: string | null): number {
  return nextSortOrderInGroup(people, (p) => (p.folderId ?? null) === folderId);
}

export function peopleAfterReorder(people: Person[], draggedKey: string, targetKey: string): Person[] | null {
  const dragged = people.find((p) => p.nameKey === draggedKey);
  const target = people.find((p) => p.nameKey === targetKey);
  if (!dragged || !target || (dragged.folderId ?? null) !== (target.folderId ?? null)) return null;

  const group = sortPeopleInFolder(people, dragged.folderId ?? null);
  const nextOrder = reorderLayoutItems(
    group.map((p) => p.nameKey),
    draggedKey,
    targetKey,
  );
  const personMap = new Map(group.map((p) => [p.nameKey, p]));

  const toSave: Person[] = [];
  nextOrder.forEach((key, index) => {
    const person = personMap.get(key);
    if (person && person.sortOrder !== index) {
      toSave.push({ ...person, sortOrder: index });
    }
  });
  return toSave.length > 0 ? toSave : null;
}

export function withPersonSortOrders(people: Person[]): Person[] {
  const orderMap = assignSortOrdersInGroups(people, folderKeyForPerson, (a, b) => {
    const aTime = a.lastActivityAtIso ?? "";
    const bTime = b.lastActivityAtIso ?? "";
    if (aTime !== bTime) return bTime.localeCompare(aTime);
    return a.displayName.localeCompare(b.displayName);
  }, (person) => person.nameKey);
  return people.map((person) => {
    const sortOrder = orderMap.get(person.nameKey);
    if (sortOrder === undefined || person.sortOrder === sortOrder) return person;
    return { ...person, sortOrder };
  });
}
