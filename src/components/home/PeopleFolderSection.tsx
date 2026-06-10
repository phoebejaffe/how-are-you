import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PeopleFolder, Person } from "../../types";
import { sortPeopleInFolder } from "../../lib/personOrder";
import { folderDropId, folderSortId, personDragId, type FolderDropData, type FolderSortData } from "../dnd/dndIds";
import { mergeRefs } from "../dnd/mergeRefs";
import { FolderHeader } from "../folders/FolderHeader";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { SortablePersonRow } from "./SortablePersonRow";

export function PeopleFolderSection({
  folder,
  people,
  onToggleCollapsed,
  onRename,
  onDelete,
  onDeletePerson,
  sortable = true,
}: {
  folder: PeopleFolder;
  people: Person[];
  onToggleCollapsed: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onDeletePerson: (nameKey: string) => void;
  sortable?: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sortedPeople = sortPeopleInFolder(people, folder.id);
  const sortableIds = sortedPeople.map((person) => personDragId(person.nameKey));

  const folderSortable = useSortable({
    id: folderSortId(folder.id),
    data: { type: "folder-sort", folderId: folder.id } satisfies FolderSortData,
    disabled: !sortable,
  });

  const droppable = useDroppable({
    id: folderDropId(folder.id),
    data: { type: "folder-drop", folderId: folder.id } satisfies FolderDropData,
    disabled: !sortable,
  });

  const style = {
    transform: CSS.Transform.toString(folderSortable.transform),
    transition: folderSortable.transition,
  };

  return (
    <div
      ref={mergeRefs(folderSortable.setNodeRef, droppable.setNodeRef)}
      style={style}
      className={`folder-card px-1 py-1 transition-shadow ${folderSortable.isDragging ? "opacity-40" : ""} ${
        droppable.isOver ? "ring-2 ring-sage/50" : ""
      } ${folder.collapsed && people.length === 0 ? "min-h-14" : ""}`}
    >
      <FolderHeader
        name={folder.name}
        count={people.length}
        collapsed={folder.collapsed}
        isFolderReorderTarget={folderSortable.isOver && !folderSortable.isDragging}
        onToggleCollapsed={onToggleCollapsed}
        onRename={onRename}
        onDeleteRequest={() => setConfirmDelete(true)}
        sortableHandleProps={
          sortable ? { ...folderSortable.attributes, ...folderSortable.listeners } : undefined
        }
        flush
      />

      {!folder.collapsed && (
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <ul className="list-divider px-1 pb-1">
            {sortedPeople.map((person) => (
              <li key={person.nameKey}>
                <SortablePersonRow
                  person={person}
                  sortable={sortable}
                  onDelete={() => onDeletePerson(person.nameKey)}
                />
              </li>
            ))}
          </ul>
        </SortableContext>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete folder?"
        message="Friends in this folder will be moved to Unsorted, not deleted."
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
