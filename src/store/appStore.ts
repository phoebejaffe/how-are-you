import { create } from "zustand";
import { validateRename } from "../domain/personRename";
import { findImportConflicts, mergePersonBundles, parseExportPayload } from "../domain/importExport";
import {
  clearPersistedUndo,
  createUndoAction,
  loadAllPersistedUndos,
  persistUndo,
  UNDO_MS,
  type UndoAction,
  type UndoSnapshot,
} from "../domain/undoQueue";
import {
  foldersFromLayoutOrder,
  reorderLayoutItems,
  resolveFactsLayoutOrder,
  saveFactsLayoutOrder,
} from "../lib/factFolders";
import { bumpLastActivity } from "../lib/lastActivity";
import {
  foldersFromLayoutOrder as peopleFoldersFromLayoutOrder,
  resolvePeopleLayoutOrder,
  savePeopleLayoutOrder,
} from "../lib/peopleFolders";
import { setTopicFollowUpsCollapsed } from "../lib/topicFollowUpCollapse";
import { createId, nowIso, personNameKey } from "../lib/ids";
import * as repo from "../storage/repository";
import type {
  ActivityType,
  Channel,
  Fact,
  FactFolder,
  FollowUp,
  ImportConflictResolution,
  PeopleFolder,
  Person,
  PersonBundle,
  Topic,
} from "../types";
import { useToastStore } from "./toastStore";

interface AppState {
  ready: boolean;
  people: Person[];
  peopleFolders: PeopleFolder[];
  bundles: Record<string, PersonBundle>;
  pendingDeletes: Set<string>;
  pendingTopicDeletes: Set<string>;
  pendingFactDeletes: Set<string>;
  pendingFollowUpDeletes: Set<string>;
  pendingArchives: Set<string>;
  hydrate: () => Promise<void>;
  refreshPeople: () => Promise<void>;
  loadBundle: (nameKey: string) => Promise<PersonBundle | null>;
  addPerson: (displayName: string) => Promise<void>;
  renamePerson: (oldKey: string, newDisplayName: string) => Promise<string>;
  scheduleDeletePerson: (nameKey: string) => Promise<void>;
  addTopic: (nameKey: string, text: string, channel: Channel) => Promise<void>;
  scheduleArchiveTopic: (topicId: string) => Promise<void>;
  unarchiveTopic: (topicId: string) => Promise<void>;
  scheduleDeleteTopic: (topicId: string) => Promise<void>;
  toggleTopicPin: (topicId: string) => Promise<void>;
  updateTopic: (topicId: string, text: string, channel: Channel) => Promise<void>;
  addFollowUp: (topicId: string, text: string, channel: Channel) => Promise<void>;
  updateFollowUp: (followUpId: string, text: string, channel: Channel) => Promise<void>;
  scheduleDeleteFollowUp: (followUpId: string) => Promise<void>;
  addFact: (nameKey: string, text: string, channel: Channel, pinned?: boolean, folderId?: string) => Promise<void>;
  updateFact: (factId: string, text: string, channel: Channel) => Promise<void>;
  toggleFactPin: (factId: string) => Promise<void>;
  moveFactToFolder: (factId: string, folderId: string | null) => Promise<void>;
  scheduleDeleteFact: (factId: string) => Promise<void>;
  addFactFolder: (nameKey: string, name: string) => Promise<void>;
  renameFactFolder: (folderId: string, name: string) => Promise<void>;
  deleteFactFolder: (folderId: string) => Promise<void>;
  toggleFactFolderCollapsed: (folderId: string) => Promise<void>;
  reorderFactsLayout: (personKey: string, draggedId: string, targetId: string) => Promise<void>;
  addPeopleFolder: (name: string) => Promise<void>;
  renamePeopleFolder: (folderId: string, name: string) => Promise<void>;
  deletePeopleFolder: (folderId: string) => Promise<void>;
  togglePeopleFolderCollapsed: (folderId: string) => Promise<void>;
  movePersonToFolder: (nameKey: string, folderId: string | null) => Promise<void>;
  reorderPeopleLayout: (draggedId: string, targetId: string) => Promise<void>;
  undoAction: (action: UndoAction) => Promise<void>;
  commitUndo: (action: UndoAction) => Promise<void>;
  restorePersistedUndos: () => Promise<void>;
  exportSelected: (selectedKeys: string[]) => void;
  importFile: (file: File) => Promise<{
    newPeople: PersonBundle[];
    conflicts: ReturnType<typeof findImportConflicts>;
    peopleFolders: PeopleFolder[];
  }>;
  applyImportResolutions: (
    importedPeople: PersonBundle[],
    resolutions: Map<string, ImportConflictResolution>,
    peopleFolders?: PeopleFolder[],
  ) => Promise<{ imported: number; merged: number; skipped: number }>;
}

function bundleKeyForTopic(bundles: Record<string, PersonBundle>, topicId: string): string | null {
  for (const [key, bundle] of Object.entries(bundles)) {
    if (bundle.topics.some((t) => t.id === topicId)) return key;
  }
  return null;
}

function bundleKeyForFact(bundles: Record<string, PersonBundle>, factId: string): string | null {
  for (const [key, bundle] of Object.entries(bundles)) {
    if (bundle.facts.some((f) => f.id === factId)) return key;
  }
  return null;
}

function bundleKeyForFactFolder(bundles: Record<string, PersonBundle>, folderId: string): string | null {
  for (const [key, bundle] of Object.entries(bundles)) {
    if (bundle.factFolders?.some((f) => f.id === folderId)) return key;
  }
  return null;
}

function bundleKeyForFollowUp(bundles: Record<string, PersonBundle>, followUpId: string): string | null {
  for (const [key, bundle] of Object.entries(bundles)) {
    if (bundle.followUps.some((f) => f.id === followUpId)) return key;
  }
  return null;
}

function showUndoToast(action: UndoAction, onUndo: () => void, onCommit: () => void) {
  useToastStore.getState().add(action.message, "info", UNDO_MS, {
    label: "Undo",
    onClick: onUndo,
    onDismiss: onCommit,
  });
}

async function syncPersonActivity(
  nameKey: string,
  set: (fn: (state: AppState) => Partial<AppState>) => void,
) {
  const updated = await repo.refreshPersonActivity(nameKey);
  if (!updated) return;
  set((state) => ({
    people: state.people.map((person) => (person.nameKey === nameKey ? updated : person)),
  }));
}

async function bumpPersonActivityInStore(
  nameKey: string,
  at: string,
  type: ActivityType,
  get: () => AppState,
  set: (fn: (state: AppState) => Partial<AppState>) => void,
) {
  const person = get().people.find((p) => p.nameKey === nameKey);
  if (!person) return;
  const updated = bumpLastActivity(person, at, type);
  if (updated === person) return;
  await repo.savePerson(updated);
  set((state) => ({
    people: state.people.map((p) => (p.nameKey === nameKey ? updated : p)),
  }));
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  people: [],
  peopleFolders: [],
  bundles: {},
  pendingDeletes: new Set(),
  pendingTopicDeletes: new Set(),
  pendingFactDeletes: new Set(),
  pendingFollowUpDeletes: new Set(),
  pendingArchives: new Set(),

  async hydrate() {
    const [people, peopleFolders] = await Promise.all([repo.listPeople(), repo.listPeopleFolders()]);
    set({ people, peopleFolders, ready: true });
    await get().restorePersistedUndos();
  },

  async refreshPeople() {
    const people = await repo.listPeople();
    set({ people });
  },

  async loadBundle(nameKey) {
    const bundle = await repo.getPersonBundle(nameKey);
    if (bundle) {
      const normalized = { ...bundle, factFolders: bundle.factFolders ?? [] };
      set((state) => ({ bundles: { ...state.bundles, [nameKey]: normalized } }));
      return normalized;
    }
    return bundle;
  },

  async addPerson(displayName) {
    const key = personNameKey(displayName);
    if (!key) throw new Error("Name cannot be empty.");
    if (get().people.some((p) => p.nameKey === key)) {
      throw new Error(`Someone named "${displayName.trim()}" already exists.`);
    }
    const now = nowIso();
    const person: Person = { nameKey: key, displayName: displayName.trim(), createdAtIso: now, updatedAtIso: now };
    await repo.savePerson(person);
    await get().refreshPeople();
    await get().loadBundle(key);
  },

  async renamePerson(oldKey, newDisplayName) {
    const result = validateRename(get().people, oldKey, newDisplayName);
    if (!result.ok) throw new Error(result.error);
    if (result.newKey === oldKey) {
      const bundle = get().bundles[oldKey];
      if (!bundle) return oldKey;
      const person = { ...bundle.person, displayName: newDisplayName.trim(), updatedAtIso: nowIso() };
      await repo.savePerson(person);
      await get().loadBundle(oldKey);
      await get().refreshPeople();
      return oldKey;
    }
    await repo.renamePerson(oldKey, result.newKey, newDisplayName.trim());
    set((state) => {
      const nextBundles = { ...state.bundles };
      if (nextBundles[oldKey]) {
        nextBundles[result.newKey] = {
          ...nextBundles[oldKey],
          person: { ...nextBundles[oldKey].person, nameKey: result.newKey, displayName: newDisplayName.trim() },
          topics: nextBundles[oldKey].topics.map((t) => ({ ...t, personNameKey: result.newKey })),
          facts: nextBundles[oldKey].facts.map((f) => ({ ...f, personNameKey: result.newKey })),
          factFolders: (nextBundles[oldKey].factFolders ?? []).map((f) => ({ ...f, personNameKey: result.newKey })),
        };
        delete nextBundles[oldKey];
      }
      return { bundles: nextBundles };
    });
    await get().refreshPeople();
    await get().loadBundle(result.newKey);
    return result.newKey;
  },

  async scheduleDeletePerson(nameKey) {
    const bundle = (await get().loadBundle(nameKey)) ?? (await repo.getPersonBundle(nameKey));
    if (!bundle) return;

    const action = createUndoAction("delete_person", `Deleted ${bundle.person.displayName}`, {
      type: "person",
      bundle,
    });
    persistUndo(action);

    set((state) => ({
      pendingDeletes: new Set(state.pendingDeletes).add(nameKey),
    }));

    const commit = async () => {
      clearPersistedUndo(action.id);
      if (!get().pendingDeletes.has(nameKey)) return;
      await repo.deletePersonHard(nameKey);
      set((state) => {
        const pendingDeletes = new Set(state.pendingDeletes);
        pendingDeletes.delete(nameKey);
        const bundles = { ...state.bundles };
        delete bundles[nameKey];
        return { pendingDeletes, bundles };
      });
      await get().refreshPeople();
    };

    const undo = async () => {
      clearPersistedUndo(action.id);
      set((state) => {
        const pendingDeletes = new Set(state.pendingDeletes);
        pendingDeletes.delete(nameKey);
        return { pendingDeletes };
      });
      await get().undoAction(action);
    };

    showUndoToast(action, undo, commit);
    setTimeout(() => {
      if (get().pendingDeletes.has(nameKey)) commit();
    }, UNDO_MS);
  },

  async addTopic(nameKey, text, channel) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const topic: Topic = {
      id: createId(),
      personNameKey: nameKey,
      text: trimmed,
      status: "active",
      pinned: false,
      createdAtIso: nowIso(),
      channel,
    };
    await repo.saveTopic(topic);
    await get().loadBundle(nameKey);
    await bumpPersonActivityInStore(nameKey, topic.createdAtIso, "topic", get, set);
  },

  async scheduleArchiveTopic(topicId) {
    const personKey = bundleKeyForTopic(get().bundles, topicId);
    if (!personKey) return;
    const bundle = get().bundles[personKey];
    const topic = bundle.topics.find((t) => t.id === topicId);
    if (!topic || topic.status === "archived") return;

    const action = createUndoAction("archive_topic", "Topic archived", {
      type: "archive_topic",
      topic,
    });
    persistUndo(action);

    const archived: Topic = { ...topic, status: "archived" };
    await repo.saveTopic(archived);
    setTopicFollowUpsCollapsed(topicId, true);
    set((state) => ({
      pendingArchives: new Set(state.pendingArchives).add(topicId),
    }));
    await get().loadBundle(personKey);

    const commit = async () => {
      clearPersistedUndo(action.id);
      set((state) => {
        const pendingArchives = new Set(state.pendingArchives);
        pendingArchives.delete(topicId);
        return { pendingArchives };
      });
    };

    const undo = async () => {
      clearPersistedUndo(action.id);
      await get().undoAction(action);
      set((state) => {
        const pendingArchives = new Set(state.pendingArchives);
        pendingArchives.delete(topicId);
        return { pendingArchives };
      });
    };

    showUndoToast(action, undo, commit);
    setTimeout(() => {
      if (get().pendingArchives.has(topicId)) commit();
    }, UNDO_MS);
  },

  async unarchiveTopic(topicId) {
    const personKey = bundleKeyForTopic(get().bundles, topicId);
    if (!personKey) return;
    const topic = get().bundles[personKey].topics.find((t) => t.id === topicId);
    if (!topic || topic.status !== "archived") return;
    await repo.saveTopic({ ...topic, status: "active" });
    await get().loadBundle(personKey);
  },

  async scheduleDeleteTopic(topicId) {
    const personKey = bundleKeyForTopic(get().bundles, topicId);
    if (!personKey) return;
    const bundle = get().bundles[personKey];
    const topic = bundle.topics.find((t) => t.id === topicId);
    if (!topic) return;
    const followUps = bundle.followUps.filter((f) => f.topicId === topicId);

    const action = createUndoAction("delete_topic", "Topic deleted", {
      type: "topic",
      topic,
      followUps,
    });
    persistUndo(action);

    set((state) => ({
      pendingTopicDeletes: new Set(state.pendingTopicDeletes).add(topicId),
    }));

    const commit = async () => {
      clearPersistedUndo(action.id);
      if (!get().pendingTopicDeletes.has(topicId)) return;
      await repo.deleteTopicHard(topicId);
      set((state) => {
        const pendingTopicDeletes = new Set(state.pendingTopicDeletes);
        pendingTopicDeletes.delete(topicId);
        return { pendingTopicDeletes };
      });
      await get().loadBundle(personKey);
      await syncPersonActivity(personKey, set);
    };

    const undo = async () => {
      clearPersistedUndo(action.id);
      set((state) => {
        const pendingTopicDeletes = new Set(state.pendingTopicDeletes);
        pendingTopicDeletes.delete(topicId);
        return { pendingTopicDeletes };
      });
      await get().undoAction(action);
    };

    showUndoToast(action, undo, commit);
    setTimeout(() => {
      if (get().pendingTopicDeletes.has(topicId)) commit();
    }, UNDO_MS);
  },

  async toggleTopicPin(topicId) {
    const personKey = bundleKeyForTopic(get().bundles, topicId);
    if (!personKey) return;
    const topic = get().bundles[personKey].topics.find((t) => t.id === topicId);
    if (!topic) return;
    await repo.saveTopic({ ...topic, pinned: !topic.pinned });
    await get().loadBundle(personKey);
  },

  async updateTopic(topicId, text, channel) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const personKey = bundleKeyForTopic(get().bundles, topicId);
    if (!personKey) return;
    const topic = get().bundles[personKey].topics.find((t) => t.id === topicId);
    if (!topic) return;
    await repo.saveTopic({ ...topic, text: trimmed, channel });
    await get().loadBundle(personKey);
  },

  async addFollowUp(topicId, text, channel) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const personKey = bundleKeyForTopic(get().bundles, topicId);
    if (!personKey) return;
    const followUp: FollowUp = {
      id: createId(),
      topicId,
      text: trimmed,
      recordedAtIso: nowIso(),
      channel,
    };
    await repo.saveFollowUp(followUp);
    await get().loadBundle(personKey);
    await bumpPersonActivityInStore(personKey, followUp.recordedAtIso, "follow_up", get, set);
  },

  async updateFollowUp(followUpId, text, channel) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const personKey = bundleKeyForFollowUp(get().bundles, followUpId);
    if (!personKey) return;
    const followUp = get().bundles[personKey].followUps.find((f) => f.id === followUpId);
    if (!followUp) return;
    await repo.saveFollowUp({ ...followUp, text: trimmed, channel });
    await get().loadBundle(personKey);
  },

  async scheduleDeleteFollowUp(followUpId) {
    const personKey = bundleKeyForFollowUp(get().bundles, followUpId);
    if (!personKey) return;
    const followUp = get().bundles[personKey].followUps.find((f) => f.id === followUpId);
    if (!followUp) return;

    const action = createUndoAction("delete_follow_up", "Follow-up deleted", {
      type: "follow_up",
      followUp,
    });
    persistUndo(action);

    set((state) => ({
      pendingFollowUpDeletes: new Set(state.pendingFollowUpDeletes).add(followUpId),
    }));

    const commit = async () => {
      clearPersistedUndo(action.id);
      if (!get().pendingFollowUpDeletes.has(followUpId)) return;
      await repo.deleteFollowUpHard(followUpId);
      set((state) => {
        const pendingFollowUpDeletes = new Set(state.pendingFollowUpDeletes);
        pendingFollowUpDeletes.delete(followUpId);
        return { pendingFollowUpDeletes };
      });
      await get().loadBundle(personKey);
      await syncPersonActivity(personKey, set);
    };

    const undo = async () => {
      clearPersistedUndo(action.id);
      set((state) => {
        const pendingFollowUpDeletes = new Set(state.pendingFollowUpDeletes);
        pendingFollowUpDeletes.delete(followUpId);
        return { pendingFollowUpDeletes };
      });
      await get().undoAction(action);
    };

    showUndoToast(action, undo, commit);
    setTimeout(() => {
      if (get().pendingFollowUpDeletes.has(followUpId)) commit();
    }, UNDO_MS);
  },

  async addFact(nameKey, text, channel, pinned = false, folderId) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const fact: Fact = {
      id: createId(),
      personNameKey: nameKey,
      text: trimmed,
      pinned,
      recordedAtIso: nowIso(),
      channel,
      ...(folderId ? { folderId } : {}),
    };
    await repo.saveFact(fact);
    await get().loadBundle(nameKey);
    await bumpPersonActivityInStore(nameKey, fact.recordedAtIso, "fact", get, set);
  },

  async updateFact(factId, text, channel) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const personKey = bundleKeyForFact(get().bundles, factId);
    if (!personKey) return;
    const fact = get().bundles[personKey].facts.find((f) => f.id === factId);
    if (!fact) return;
    await repo.saveFact({ ...fact, text: trimmed, channel });
    await get().loadBundle(personKey);
  },

  async toggleFactPin(factId) {
    const personKey = bundleKeyForFact(get().bundles, factId);
    if (!personKey) return;
    const fact = get().bundles[personKey].facts.find((f) => f.id === factId);
    if (!fact) return;
    await repo.saveFact({ ...fact, pinned: !fact.pinned });
    await get().loadBundle(personKey);
  },

  async moveFactToFolder(factId, folderId) {
    const personKey = bundleKeyForFact(get().bundles, factId);
    if (!personKey) return;
    const bundle = get().bundles[personKey];
    const fact = bundle.facts.find((f) => f.id === factId);
    if (!fact) return;
    if (folderId && !bundle.factFolders.some((f) => f.id === folderId)) return;

    const next = { ...fact };
    if (folderId) next.folderId = folderId;
    else delete next.folderId;

    await repo.saveFact(next);
    await get().loadBundle(personKey);
  },

  async addFactFolder(nameKey, name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const bundle = (await get().loadBundle(nameKey)) ?? get().bundles[nameKey];
    const folders = bundle?.factFolders ?? [];
    const maxOrder = folders.reduce((max, folder) => Math.max(max, folder.sortOrder), -1);
    const folder: FactFolder = {
      id: createId(),
      personNameKey: nameKey,
      name: trimmed,
      collapsed: false,
      sortOrder: maxOrder + 1,
    };
    await repo.saveFactFolder(folder);
    await get().loadBundle(nameKey);
  },

  async renameFactFolder(folderId, name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const personKey = bundleKeyForFactFolder(get().bundles, folderId);
    if (!personKey) return;
    const folder = get().bundles[personKey].factFolders.find((f) => f.id === folderId);
    if (!folder) return;
    await repo.saveFactFolder({ ...folder, name: trimmed });
    await get().loadBundle(personKey);
  },

  async deleteFactFolder(folderId) {
    const personKey = bundleKeyForFactFolder(get().bundles, folderId);
    if (!personKey) return;
    const bundle = get().bundles[personKey];
    const factsInFolder = bundle.facts.filter((f) => f.folderId === folderId);
    for (const fact of factsInFolder) {
      const next = { ...fact };
      delete next.folderId;
      await repo.saveFact(next);
    }
    await repo.deleteFactFolderHard(folderId);
    await get().loadBundle(personKey);
  },

  async toggleFactFolderCollapsed(folderId) {
    const personKey = bundleKeyForFactFolder(get().bundles, folderId);
    if (!personKey) return;
    const folder = get().bundles[personKey].factFolders.find((f) => f.id === folderId);
    if (!folder) return;
    await repo.saveFactFolder({ ...folder, collapsed: !folder.collapsed });
    await get().loadBundle(personKey);
  },

  async reorderFactsLayout(personKey, draggedId, targetId) {
    if (draggedId === targetId) return;
    const bundle = get().bundles[personKey];
    if (!bundle) return;

    const currentOrder = resolveFactsLayoutOrder(personKey, bundle.factFolders);
    const nextOrder = reorderLayoutItems(currentOrder, draggedId, targetId);
    saveFactsLayoutOrder(personKey, nextOrder);

    const reorderedFolders = foldersFromLayoutOrder(bundle.factFolders, nextOrder);
    for (const folder of reorderedFolders) {
      const prev = bundle.factFolders.find((f) => f.id === folder.id);
      if (prev && prev.sortOrder !== folder.sortOrder) {
        await repo.saveFactFolder(folder);
      }
    }
    await get().loadBundle(personKey);
  },

  async addPeopleFolder(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const folders = get().peopleFolders;
    const maxOrder = folders.reduce((max, folder) => Math.max(max, folder.sortOrder), -1);
    const folder: PeopleFolder = {
      id: createId(),
      name: trimmed,
      collapsed: false,
      sortOrder: maxOrder + 1,
    };
    await repo.savePeopleFolder(folder);
    set({ peopleFolders: [...folders, folder].sort((a, b) => a.sortOrder - b.sortOrder) });
  },

  async renamePeopleFolder(folderId, name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const folder = get().peopleFolders.find((f) => f.id === folderId);
    if (!folder) return;
    const updated = { ...folder, name: trimmed };
    await repo.savePeopleFolder(updated);
    set({
      peopleFolders: get()
        .peopleFolders.map((f) => (f.id === folderId ? updated : f))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    });
  },

  async deletePeopleFolder(folderId) {
    const peopleInFolder = get().people.filter((p) => p.folderId === folderId);
    for (const person of peopleInFolder) {
      const next = { ...person };
      delete next.folderId;
      await repo.savePerson(next);
    }
    await repo.deletePeopleFolderHard(folderId);
    set({
      people: get().people.map((person) => {
        if (person.folderId !== folderId) return person;
        const next = { ...person };
        delete next.folderId;
        return next;
      }),
      peopleFolders: get().peopleFolders.filter((f) => f.id !== folderId),
    });
  },

  async togglePeopleFolderCollapsed(folderId) {
    const folder = get().peopleFolders.find((f) => f.id === folderId);
    if (!folder) return;
    const updated = { ...folder, collapsed: !folder.collapsed };
    await repo.savePeopleFolder(updated);
    set({
      peopleFolders: get().peopleFolders.map((f) => (f.id === folderId ? updated : f)),
    });
  },

  async movePersonToFolder(nameKey, folderId) {
    const person = get().people.find((p) => p.nameKey === nameKey);
    if (!person) return;
    if (folderId && !get().peopleFolders.some((f) => f.id === folderId)) return;

    const next = { ...person };
    if (folderId) next.folderId = folderId;
    else delete next.folderId;

    await repo.savePerson(next);
    set({
      people: get().people.map((p) => (p.nameKey === nameKey ? next : p)),
    });
  },

  async reorderPeopleLayout(draggedId, targetId) {
    if (draggedId === targetId) return;

    const folders = get().peopleFolders;
    const currentOrder = resolvePeopleLayoutOrder(folders);
    const nextOrder = reorderLayoutItems(currentOrder, draggedId, targetId);
    savePeopleLayoutOrder(nextOrder);

    const reorderedFolders = peopleFoldersFromLayoutOrder(folders, nextOrder);
    for (const folder of reorderedFolders) {
      const prev = folders.find((f) => f.id === folder.id);
      if (prev && prev.sortOrder !== folder.sortOrder) {
        await repo.savePeopleFolder(folder);
      }
    }
    set({ peopleFolders: reorderedFolders });
  },

  async scheduleDeleteFact(factId) {
    const personKey = bundleKeyForFact(get().bundles, factId);
    if (!personKey) return;
    const fact = get().bundles[personKey].facts.find((f) => f.id === factId);
    if (!fact) return;

    const action = createUndoAction("delete_fact", "Fact deleted", { type: "fact", fact });
    persistUndo(action);

    set((state) => ({
      pendingFactDeletes: new Set(state.pendingFactDeletes).add(factId),
    }));

    const commit = async () => {
      clearPersistedUndo(action.id);
      if (!get().pendingFactDeletes.has(factId)) return;
      await repo.deleteFactHard(factId);
      set((state) => {
        const pendingFactDeletes = new Set(state.pendingFactDeletes);
        pendingFactDeletes.delete(factId);
        return { pendingFactDeletes };
      });
      await get().loadBundle(personKey);
      await syncPersonActivity(personKey, set);
    };

    const undo = async () => {
      clearPersistedUndo(action.id);
      set((state) => {
        const pendingFactDeletes = new Set(state.pendingFactDeletes);
        pendingFactDeletes.delete(factId);
        return { pendingFactDeletes };
      });
      await get().undoAction(action);
    };

    showUndoToast(action, undo, commit);
    setTimeout(() => {
      if (get().pendingFactDeletes.has(factId)) commit();
    }, UNDO_MS);
  },

  async undoAction(action) {
    const snapshot = action.snapshot as UndoSnapshot;
    if (snapshot.type === "person") {
      await repo.savePersonBundle(snapshot.bundle);
      set((state) => ({
        bundles: { ...state.bundles, [snapshot.bundle.person.nameKey]: snapshot.bundle },
      }));
      await get().refreshPeople();
    } else if (snapshot.type === "topic") {
      await repo.saveTopic(snapshot.topic);
      for (const f of snapshot.followUps) await repo.saveFollowUp(f);
      await get().loadBundle(snapshot.topic.personNameKey);
    } else if (snapshot.type === "fact") {
      await repo.saveFact(snapshot.fact);
      await get().loadBundle(snapshot.fact.personNameKey);
    } else if (snapshot.type === "follow_up") {
      await repo.saveFollowUp(snapshot.followUp);
      const personKey = bundleKeyForTopic(get().bundles, snapshot.followUp.topicId);
      if (personKey) await get().loadBundle(personKey);
    } else if (snapshot.type === "archive_topic") {
      await repo.saveTopic(snapshot.topic);
      await get().loadBundle(snapshot.topic.personNameKey);
    }
  },

  async commitUndo(action) {
    const snapshot = action.snapshot as UndoSnapshot;
    if (snapshot.type === "person") {
      await repo.deletePersonHard(snapshot.bundle.person.nameKey);
      await get().refreshPeople();
    } else if (snapshot.type === "topic") {
      await repo.deleteTopicHard(snapshot.topic.id);
      await get().loadBundle(snapshot.topic.personNameKey);
    } else if (snapshot.type === "fact") {
      await repo.deleteFactHard(snapshot.fact.id);
      await get().loadBundle(snapshot.fact.personNameKey);
    } else if (snapshot.type === "follow_up") {
      await repo.deleteFollowUpHard(snapshot.followUp.id);
      const personKey = bundleKeyForTopic(get().bundles, snapshot.followUp.topicId);
      if (personKey) await get().loadBundle(personKey);
    }
  },

  async restorePersistedUndos() {
    const actions = loadAllPersistedUndos();
    for (const action of actions) {
      if (action.commitAtMs <= Date.now()) {
        clearPersistedUndo(action.id);
        await get().commitUndo(action);
        continue;
      }
      const remaining = action.commitAtMs - Date.now();
      const snapshot = action.snapshot;
      if (snapshot.type === "person") {
        set((state) => ({
          pendingDeletes: new Set(state.pendingDeletes).add(snapshot.bundle.person.nameKey),
        }));
      } else if (snapshot.type === "topic") {
        set((state) => ({
          pendingTopicDeletes: new Set(state.pendingTopicDeletes).add(snapshot.topic.id),
        }));
      } else if (snapshot.type === "fact") {
        set((state) => ({
          pendingFactDeletes: new Set(state.pendingFactDeletes).add(snapshot.fact.id),
        }));
      } else if (snapshot.type === "follow_up") {
        set((state) => ({
          pendingFollowUpDeletes: new Set(state.pendingFollowUpDeletes).add(snapshot.followUp.id),
        }));
      } else if (snapshot.type === "archive_topic") {
        set((state) => ({
          pendingArchives: new Set(state.pendingArchives).add(snapshot.topic.id),
        }));
      }
      setTimeout(() => get().commitUndo(action), remaining);
    }
  },

  exportSelected(_selectedKeys) {
    // Export is handled in SettingsPage via repository for completeness.
  },

  async importFile(file) {
    const text = await file.text();
    const payload = parseExportPayload(JSON.parse(text));
    const existing = await repo.listAllBundles();
    const existingKeys = new Set(existing.map((b) => b.person.nameKey));
    const conflicts = findImportConflicts(payload.people, existing);
    const conflictKeys = new Set(conflicts.map((c) => c.imported.person.nameKey));
    const newPeople = payload.people.filter((p) => !existingKeys.has(p.person.nameKey) && !conflictKeys.has(p.person.nameKey));
    return { newPeople, conflicts, peopleFolders: payload.peopleFolders ?? [] };
  },

  async applyImportResolutions(importedPeople, resolutions, peopleFolders = []) {
    const existing = await repo.listAllBundles();
    const existingByKey = new Map(existing.map((b) => [b.person.nameKey, b]));
    let imported = 0;
    let mergedCount = 0;
    let skipped = 0;

    for (const bundle of importedPeople) {
      const key = bundle.person.nameKey;
      const existingBundle = existingByKey.get(key);

      if (!existingBundle) {
        await repo.savePersonBundle(bundle);
        imported++;
        continue;
      }

      const resolution = resolutions.get(key) ?? "ignore";
      if (resolution === "ignore") {
        skipped++;
      } else if (resolution === "override") {
        await repo.replacePersonBundle(key, bundle);
        imported++;
      } else if (resolution === "merge") {
        await repo.replacePersonBundle(key, mergePersonBundles(existingBundle, bundle));
        mergedCount++;
      }
    }

    if (peopleFolders.length > 0) {
      for (const folder of peopleFolders) {
        await repo.savePeopleFolder(folder);
      }
      set({ peopleFolders: await repo.listPeopleFolders() });
    }

    await get().hydrate();
    for (const person of get().people) {
      await get().loadBundle(person.nameKey);
    }
    return { imported, merged: mergedCount, skipped };
  },
}));
