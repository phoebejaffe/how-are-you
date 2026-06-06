import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PeopleFolder, Person } from "../../types";
import {
  folderIdFromDropId,
  folderIdFromSortId,
  folderSortId,
  isFolderDropId,
  isFolderSortId,
  isPersonDragId,
} from "../dnd/dndIds";
import { useAppDndSensors } from "../dnd/dndSensors";
import {
  groupPeople,
  moveUnsortedToEnd,
  resolvePeopleLayoutOrder,
  savePeopleLayoutOrder,
  UNSORTED_DROP_ID,
} from "../../lib/peopleFolders";
import { FolderPlusIcon } from "../ui/FolderPlusIcon";
import { PeopleFolderSection } from "./PeopleFolderSection";
import { UnsortedPeopleSection } from "./UnsortedPeopleSection";

export function FriendsSection({
  people,
  folders,
  onDeletePerson,
  onMovePersonToFolder,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolderCollapsed,
  onReorderLayout,
}: {
  people: Person[];
  folders: PeopleFolder[];
  onDeletePerson: (nameKey: string) => void;
  onMovePersonToFolder: (nameKey: string, folderId: string | null) => void;
  onAddFolder: (name: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolderCollapsed: (folderId: string) => void;
  onReorderLayout: (draggedId: string, targetId: string) => void;
}) {
  const sensors = useAppDndSensors();
  const [addingFolder, setAddingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [activePersonKey, setActivePersonKey] = useState<string | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);

  const grouped = useMemo(() => groupPeople(people, folders), [people, folders]);
  const hasFolders = folders.length > 0;
  const hasAnyPeople = people.length > 0 || hasFolders;

  const layoutOrder = useMemo(() => resolvePeopleLayoutOrder(folders), [folders, layoutVersion]);
  const sortableIds = useMemo(() => layoutOrder.map((id) => folderSortId(id)), [layoutOrder]);

  const folderPeopleMap = useMemo(() => {
    const map = new Map<string, Person[]>();
    for (const { folder, people: folderPeople } of grouped.folders) {
      map.set(folder.id, folderPeople);
    }
    return map;
  }, [grouped.folders]);

  const folderMap = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders]);

  const unsortedVisible = grouped.unsorted.length > 0 || activePersonKey !== null;
  const wasUnsortedVisibleRef = useRef(unsortedVisible);

  useEffect(() => {
    if (unsortedVisible && !wasUnsortedVisibleRef.current) {
      const next = moveUnsortedToEnd(resolvePeopleLayoutOrder(folders));
      savePeopleLayoutOrder(next);
      setLayoutVersion((v) => v + 1);
    }
    wasUnsortedVisibleRef.current = unsortedVisible;
  }, [unsortedVisible, folders]);

  const activePerson = activePersonKey ? people.find((p) => p.nameKey === activePersonKey) : null;

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (isPersonDragId(id)) {
      setActivePersonKey(id.slice("person:".length));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActivePersonKey(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (isPersonDragId(activeId)) {
      const nameKey = activeId.slice("person:".length);
      let targetFolderId: string | null | undefined;

      if (isFolderDropId(overId)) {
        targetFolderId = folderIdFromDropId(overId);
      } else if (isFolderSortId(overId)) {
        const folderId = folderIdFromSortId(overId);
        targetFolderId = folderId === UNSORTED_DROP_ID ? null : folderId;
      }

      if (targetFolderId !== undefined) {
        const person = people.find((p) => p.nameKey === nameKey);
        const currentFolderId = person?.folderId ?? null;
        if (person && currentFolderId !== targetFolderId) {
          onMovePersonToFolder(nameKey, targetFolderId);
        }
      }
      return;
    }

    if (isFolderSortId(activeId) && isFolderSortId(overId) && activeId !== overId) {
      onReorderLayout(folderIdFromSortId(activeId), folderIdFromSortId(overId));
      setLayoutVersion((v) => v + 1);
    }
  }

  return (
    <section>
      <div className="mb-1 flex items-baseline gap-2 pr-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-stone-600">Friends</h2>
        {!addingFolder && (
          <button
            type="button"
            onClick={() => setAddingFolder(true)}
            className="ml-auto shrink-0 rounded p-0.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
            aria-label="New folder"
          >
            <FolderPlusIcon />
          </button>
        )}
      </div>

      {addingFolder && (
        <form
          className="my-1 flex flex-wrap items-center gap-1 px-1"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = folderName.trim();
            if (!trimmed) return;
            onAddFolder(trimmed);
            setFolderName("");
            setAddingFolder(false);
          }}
        >
          <input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name…"
            className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white/80 px-3 py-1.5 text-sm"
            autoFocus
          />
          <button type="submit" className="rounded-lg bg-sage px-3 py-1.5 text-sm text-white hover:bg-sage-dark">
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              setFolderName("");
              setAddingFolder(false);
            }}
            aria-label="Cancel"
            className="rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100"
          >
            X
          </button>
        </form>
      )}

      {!hasAnyPeople && <p className="px-2 py-8 text-center text-sm text-stone-400">No friends yet — add someone above.</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {layoutOrder.map((itemId) => {
            if (itemId === UNSORTED_DROP_ID) {
              if (!unsortedVisible) return null;
              return (
                <UnsortedPeopleSection
                  key={itemId}
                  people={grouped.unsorted}
                  onDeletePerson={onDeletePerson}
                />
              );
            }

            const folder = folderMap.get(itemId);
            if (!folder) return null;

            return (
              <PeopleFolderSection
                key={itemId}
                folder={folder}
                people={folderPeopleMap.get(itemId) ?? []}
                onToggleCollapsed={() => onToggleFolderCollapsed(folder.id)}
                onRename={(name) => onRenameFolder(folder.id, name)}
                onDelete={() => onDeleteFolder(folder.id)}
                onDeletePerson={onDeletePerson}
              />
            );
          })}
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activePerson ? (
            <div className="rounded-lg bg-white/95 px-3 py-2.5 shadow-md ring-1 ring-sage/40">
              <span className="text-sm font-medium text-stone-800">{activePerson.displayName}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
