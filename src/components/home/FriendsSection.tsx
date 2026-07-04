import { useEffect, useMemo, useRef, useState } from "react";
import type { PeopleFolder, Person } from "../../types";
import {
  groupPeople,
  moveUnsortedToEnd,
  resolvePeopleLayoutOrder,
  savePeopleLayoutOrder,
  UNSORTED_DROP_ID,
} from "../../lib/peopleFolders";
import { FolderPlusIcon } from "../ui/FolderPlusIcon";
import { IconButton } from "../ui/IconButton";
import { PersonPlusIcon } from "../ui/PersonPlusIcon";
import { AddPersonDialog } from "./AddPersonDialog";
import { PeopleFolderSection } from "./PeopleFolderSection";
import { UnsortedPeopleSection } from "./UnsortedPeopleSection";
import { PeopleListDnd } from "./people-dnd/PeopleListDnd";

export function FriendsSection({
  people,
  folders,
  sortable = true,
  onDeletePerson,
  onMovePersonToFolder,
  onDropPersonOnPerson,
  onAddPerson,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolderCollapsed,
  onApplyLayoutOrder,
}: {
  people: Person[];
  folders: PeopleFolder[];
  sortable?: boolean;
  onDeletePerson: (nameKey: string) => void;
  onMovePersonToFolder: (nameKey: string, folderId: string | null) => void;
  onDropPersonOnPerson: (draggedKey: string, targetKey: string) => void;
  onAddPerson: (name: string, context?: string) => Promise<void>;
  onAddFolder: (name: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolderCollapsed: (folderId: string) => void;
  onApplyLayoutOrder: (order: string[]) => void;
}) {
  const [addingFolder, setAddingFolder] = useState(false);
  const [addingPerson, setAddingPerson] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | undefined>(undefined);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [draggingPerson, setDraggingPerson] = useState(false);

  const grouped = useMemo(() => groupPeople(people, folders), [people, folders]);
  const hasFolders = folders.length > 0;
  const hasAnyPeople = people.length > 0 || hasFolders;

  const folderPeopleMap = useMemo(() => {
    const map = new Map<string, Person[]>();
    for (const { folder, people: folderPeople } of grouped.folders) {
      map.set(folder.id, folderPeople);
    }
    return map;
  }, [grouped.folders]);

  const folderMap = useMemo(() => new Map(folders.map((f) => [f.id, f])), [folders]);

  const unsortedVisible = grouped.unsorted.length > 0 || draggingPerson;
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

  function renderFolderList(layoutOrder: string[]) {
    return layoutOrder.map((itemId) => {
      if (itemId === UNSORTED_DROP_ID) {
        if (!unsortedVisible) return null;
        return (
          <UnsortedPeopleSection
            key={itemId}
            people={grouped.unsorted}
            sortable={sortable}
            highlightDropTarget={dragOverFolderId === null}
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
          highlightDropTarget={dragOverFolderId === folder.id}
          onToggleCollapsed={() => onToggleFolderCollapsed(folder.id)}
          onRename={(name) => onRenameFolder(folder.id, name)}
          onDelete={() => onDeleteFolder(folder.id)}
          onDeletePerson={onDeletePerson}
        />
      );
    });
  }

  const staticLayoutOrder = useMemo(() => resolvePeopleLayoutOrder(folders), [folders, layoutVersion]);

  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">My people</h2>
        <div className="ml-auto flex items-center gap-1">
          <IconButton onClick={() => setAddingPerson(true)} aria-label="Add person">
            <PersonPlusIcon />
          </IconButton>
          {!addingFolder && (
            <IconButton onClick={() => setAddingFolder(true)} aria-label="New folder">
              <FolderPlusIcon />
            </IconButton>
          )}
        </div>
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

      {!hasAnyPeople && <p className="empty-state">No people yet — tap the add person button to get started.</p>}

      {sortable ? (
        <PeopleListDnd
          folders={folders}
          people={people}
          layoutVersion={layoutVersion}
          onMovePersonToFolder={onMovePersonToFolder}
          onDropPersonOnPerson={onDropPersonOnPerson}
          onApplyLayoutOrder={onApplyLayoutOrder}
          onHighlightFolder={setDragOverFolderId}
          onFolderReorderDone={() => setLayoutVersion((v) => v + 1)}
          onPersonDragChange={setDraggingPerson}
        >
          {renderFolderList}
        </PeopleListDnd>
      ) : (
        renderFolderList(staticLayoutOrder)
      )}

      <AddPersonDialog
        open={addingPerson}
        onClose={() => setAddingPerson(false)}
        onAdd={onAddPerson}
      />
    </section>
  );
}
