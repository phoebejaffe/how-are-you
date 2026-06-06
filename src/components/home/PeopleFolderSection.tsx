import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PeopleFolder, Person } from "../../types";
import { folderDropId, folderSortId, type FolderDropData, type FolderSortData } from "../dnd/dndIds";
import { FolderHeader } from "../folders/FolderHeader";
import { mergeRefs } from "../dnd/mergeRefs";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { PersonListRow, sortPeople } from "./PersonListRow";

export function PeopleFolderSection({
  folder,
  people,
  onToggleCollapsed,
  onRename,
  onDelete,
  onDeletePerson,
}: {
  folder: PeopleFolder;
  people: Person[];
  onToggleCollapsed: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onDeletePerson: (nameKey: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sortedPeople = sortPeople(people);

  const sortable = useSortable({
    id: folderSortId(folder.id),
    data: { type: "folder-sort", folderId: folder.id } satisfies FolderSortData,
  });

  const droppable = useDroppable({
    id: folderDropId(folder.id),
    data: { type: "folder-drop", folderId: folder.id } satisfies FolderDropData,
  });

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  return (
    <div
      ref={mergeRefs(sortable.setNodeRef, droppable.setNodeRef)}
      style={style}
      className={`mb-2 rounded-lg bg-white/50 ring-1 ring-stone-200/60 transition-shadow ${
        sortable.isDragging ? "opacity-40" : ""
      } ${droppable.isOver ? "ring-2 ring-sage/60" : ""}`}
    >
      <FolderHeader
        name={folder.name}
        count={people.length}
        collapsed={folder.collapsed}
        isFolderReorderTarget={sortable.isOver && !sortable.isDragging}
        onToggleCollapsed={onToggleCollapsed}
        onRename={onRename}
        onDeleteRequest={() => setConfirmDelete(true)}
        sortableHandleProps={{ ...sortable.attributes, ...sortable.listeners }}
      />

      {!folder.collapsed && (
        <ul className="divide-y divide-stone-200/80 pl-4">
          {sortedPeople.map((person) => (
            <li key={person.nameKey}>
              <PersonListRow
                person={person}
                draggable
                onDelete={() => onDeletePerson(person.nameKey)}
              />
            </li>
          ))}
        </ul>
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
