import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UNSORTED_DROP_ID } from "../../lib/folders";
import type { Person } from "../../types";
import { folderDropId, folderSortId, type FolderDropData, type FolderSortData } from "../dnd/dndIds";
import { UnsortedFolderHeader } from "../folders/FolderHeader";
import { mergeRefs } from "../dnd/mergeRefs";
import { PersonListRow, sortPeople } from "./PersonListRow";

export function UnsortedPeopleSection({
  people,
  onDeletePerson,
}: {
  people: Person[];
  onDeletePerson: (nameKey: string) => void;
}) {
  const sortedPeople = sortPeople(people);

  const sortable = useSortable({
    id: folderSortId(UNSORTED_DROP_ID),
    data: { type: "folder-sort", folderId: UNSORTED_DROP_ID } satisfies FolderSortData,
  });

  const droppable = useDroppable({
    id: folderDropId(UNSORTED_DROP_ID),
    data: { type: "folder-drop", folderId: null } satisfies FolderDropData,
  });

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  return (
    <div
      ref={mergeRefs(sortable.setNodeRef, droppable.setNodeRef)}
      style={style}
      className={`mb-2 rounded-lg bg-stone-100/80 px-1 py-1 ring-1 ring-stone-200/60 transition-shadow ${
        sortable.isDragging ? "opacity-40" : ""
      } ${droppable.isOver ? "ring-2 ring-sage/60" : ""} ${people.length === 0 ? "min-h-12" : ""}`}
    >
      <UnsortedFolderHeader
        label="Unsorted"
        count={people.length}
        isFolderReorderTarget={sortable.isOver && !sortable.isDragging}
        sortableHandleProps={{ ...sortable.attributes, ...sortable.listeners }}
      />
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
    </div>
  );
}
