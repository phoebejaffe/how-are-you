import { UNSORTED_DROP_ID } from "../../lib/folders";

export type PersonDragData = { type: "person"; nameKey: string };
export type FactDragData = { type: "fact"; factId: string };
export type TopicSortData = { type: "topic-sort"; topicId: string };
export type FolderSortData = { type: "folder-sort"; folderId: string };
export type FolderDropData = { type: "folder-drop"; folderId: string | null };

export function personDragId(nameKey: string): string {
  return `person:${nameKey}`;
}

export function factDragId(factId: string): string {
  return `fact:${factId}`;
}

export function topicSortId(topicId: string): string {
  return `topic-sort:${topicId}`;
}

export function topicDragId(topicId: string): string {
  return `topic:${topicId}`;
}

export function topicIdFromSortId(sortId: string): string {
  return sortId.slice("topic-sort:".length);
}

export function topicIdFromDragId(dragId: string): string {
  return dragId.slice("topic:".length);
}

export function isTopicSortId(id: string | number): boolean {
  return String(id).startsWith("topic-sort:");
}

export function isTopicDragId(id: string | number): boolean {
  return String(id).startsWith("topic:");
}

export function folderSortId(folderId: string): string {
  return `folder-sort:${folderId}`;
}

export function folderDropId(folderId: string): string {
  return `folder-drop:${folderId}`;
}

export function folderDropIdFromFolderId(folderId: string | null): string {
  return folderDropId(folderId ?? UNSORTED_DROP_ID);
}

export function folderIdFromDropId(dropId: string): string | null | undefined {
  if (!dropId.startsWith("folder-drop:")) return undefined;
  const id = dropId.slice("folder-drop:".length);
  return id === UNSORTED_DROP_ID ? null : id;
}

export function folderIdFromSortId(sortId: string): string {
  return sortId.slice("folder-sort:".length);
}

export function isPersonDragId(id: string | number): boolean {
  return String(id).startsWith("person:");
}

export function isFactDragId(id: string | number): boolean {
  return String(id).startsWith("fact:");
}

export function isFolderSortId(id: string | number): boolean {
  return String(id).startsWith("folder-sort:");
}

export function isFolderDropId(id: string | number): boolean {
  return String(id).startsWith("folder-drop:");
}
