import { type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { AppDndContext } from "../dnd/AppDndContext";
import { AppDragOverlay } from "../dnd/AppDragOverlay";
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
import { personCollisionDetection } from "../dnd/personCollisionDetection";
import { useAppDndSensors } from "../dnd/dndSensors";
import {
  groupPeople,
  moveUnsortedToEnd,
  resolvePeopleLayoutOrder,
  savePeopleLayoutOrder,
  UNSORTED_DROP_ID,
} from "../../lib/peopleFolders";
import { FolderPlusIcon } from "../ui/FolderPlusIcon";
import { IconButton } from "../ui/IconButton";
import { PeopleFolderSection } from "./PeopleFolderSection";
import { PersonListRow } from "./PersonListRow";
import { UnsortedPeopleSection } from "./UnsortedPeopleSection";

export function FriendsSection({
  people,
  folders,
  sortable = true,
  onDeletePerson,
  onMovePersonToFolder,
  onDropPersonOnPerson,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolderCollapsed,
  onReorderLayout,
}: {
  people: Person[];
  folders: PeopleFolder[];
  sortable?: boolean;
  onDeletePerson: (nameKey: string) => void;
  onMovePersonToFolder: (nameKey: string, folderId: string | null) => void;
  onDropPersonOnPerson: (draggedKey: string, targetKey: string) => void;
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
    if (!sortable) return;
    if (unsortedVisible && !wasUnsortedVisibleRef.current) {
      const next = moveUnsortedToEnd(resolvePeopleLayoutOrder(folders));
      savePeopleLayoutOrder(next);
      setLayoutVersion((v) => v + 1);
    }
    wasUnsortedVisibleRef.current = unsortedVisible;
  }, [unsortedVisible, folders, sortable]);

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

    if (isPersonDragId(activeId) && isPersonDragId(overId) && activeId !== overId) {
      onDropPersonOnPerson(activeId.slice("person:".length), overId.slice("person:".length));
      return;
    }

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

  const folderList = layoutOrder.map((itemId) => {
    if (itemId === UNSORTED_DROP_ID) {
      if (!unsortedVisible) return null;
      return (
        <UnsortedPeopleSection
          key={itemId}
          people={grouped.unsorted}
          sortable={sortable}
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
        sortable={sortable}
        onToggleCollapsed={() => onToggleFolderCollapsed(folder.id)}
        onRename={(name) => onRenameFolder(folder.id, name)}
        onDelete={() => onDeleteFolder(folder.id)}
        onDeletePerson={onDeletePerson}
      />
    );
  });

  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">Friends</h2>
        {!addingFolder && (
          <IconButton className="ml-auto" onClick={() => setAddingFolder(true)} aria-label="New folder">
            <FolderPlusIcon />
          </IconButton>
        )}
      </div>

      {addingFolder && (
        <form
          className="card-padded mb-4 flex flex-wrap items-center gap-2.5"
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
            className="input input-compact min-w-0 flex-1"
            autoFocus
          />
          <button type="submit" className="btn-primary btn-compact">
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              setFolderName("");
              setAddingFolder(false);
            }}
            aria-label="Cancel"
            className="btn-ghost btn-compact min-w-11 px-3"
          >
            ✕
          </button>
        </form>
      )}

      {!hasAnyPeople && <p className="empty-state">No friends yet — add someone above.</p>}

      {sortable ? (
        <AppDndContext
          sensors={sensors}
          collisionDetection={personCollisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {folderList}
          </SortableContext>

          <AppDragOverlay>
            {activePerson ? <PersonListRow person={activePerson} overlay /> : null}
          </AppDragOverlay>
        </AppDndContext>
      ) : (
        folderList
      )}
    </section>
  );
}
