import type { Fact, PersonBundle, Topic } from "../types";

export const UNDO_MS = 10_000;
const PERSIST_KEY = "how-are-you-pending-undo";

export type UndoActionType =
  | "delete_person"
  | "delete_topic"
  | "delete_fact"
  | "archive_topic";

export interface UndoAction {
  id: string;
  type: UndoActionType;
  message: string;
  commitAtMs: number;
  snapshot: UndoSnapshot;
}

export type UndoSnapshot =
  | { type: "person"; bundle: PersonBundle }
  | { type: "topic"; topic: Topic; followUps: import("../types").FollowUp[] }
  | { type: "fact"; fact: Fact }
  | { type: "archive_topic"; topic: Topic };

type PersistedUndo = Omit<UndoAction, "id"> & { id: string };

function loadPersisted(): Record<string, PersistedUndo> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PersistedUndo>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function savePersisted(map: Record<string, PersistedUndo>): void {
  if (typeof window === "undefined") return;
  try {
    if (Object.keys(map).length === 0) {
      localStorage.removeItem(PERSIST_KEY);
    } else {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(map));
    }
  } catch {
    // quota / private mode
  }
}

export function persistUndo(action: UndoAction): void {
  const map = loadPersisted();
  map[action.id] = action;
  savePersisted(map);
}

export function clearPersistedUndo(id: string): void {
  const map = loadPersisted();
  if (!(id in map)) return;
  delete map[id];
  savePersisted(map);
}

export function loadDueUndos(now = Date.now()): UndoAction[] {
  const map = loadPersisted();
  return Object.values(map).filter((a) => a.commitAtMs <= now) as UndoAction[];
}

export function loadAllPersistedUndos(): UndoAction[] {
  return Object.values(loadPersisted()) as UndoAction[];
}

export function createUndoAction(
  type: UndoActionType,
  message: string,
  snapshot: UndoSnapshot,
): UndoAction {
  return {
    id: crypto.randomUUID(),
    type,
    message,
    commitAtMs: Date.now() + UNDO_MS,
    snapshot,
  };
}
