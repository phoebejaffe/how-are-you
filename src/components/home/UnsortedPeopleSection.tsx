import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UNSORTED_DROP_ID } from "../../lib/folders";
import { sortPeopleInFolder } from "../../lib/personOrder";
import type { Person } from "../../types";
import { folderDropId, folderSortId, personDragId, type FolderDropData, type FolderSortData } from "../dnd/dndIds";
import { UnsortedFolderHeader } from "../folders/FolderHeader";
import { SortablePersonRow } from "./SortablePersonRow";

export function UnsortedPeopleSection({
  people,
  onDeletePerson,
  sortable = true,
}: {
  people: Person[];
  onDeletePerson: (nameKey: string) => void;
  sortable?: boolean;
}) {
  const sortedPeople = sortPeopleInFolder(people, null);
  const sortableIds = sortedPeople.map((person) => personDragId(person.nameKey));

  const folderSortable = useSortable({
    id: folderSortId(UNSORTED_DROP_ID),
    data: { type: "folder-sort", folderId: UNSORTED_DROP_ID } satisfies FolderSortData,
    disabled: !sortable,
  });

  const droppable = useDroppable({
    id: folderDropId(UNSORTED_DROP_ID),
    data: { type: "folder-drop", folderId: null } satisfies FolderDropData,
    disabled: !sortable,
  });

  const style = {
    transform: CSS.Transform.toString(folderSortable.transform),
    transition: folderSortable.transition,
  };

  return (
    <div
      ref={folderSortable.setNodeRef}
      style={style}
      className={`folder-card-unsorted px-1 py-1 transition-shadow ${
        folderSortable.isDragging ? "opacity-40" : ""
      }`}
    >
      <div
        ref={droppable.setNodeRef}
        className={`rounded-2xl transition-shadow ${droppable.isOver ? "ring-2 ring-sage/50" : ""} ${
          people.length === 0 ? "min-h-14" : ""
        }`}
      >
        <UnsortedFolderHeader
          label="Unsorted"
          count={people.length}
          isFolderReorderTarget={folderSortable.isOver && !folderSortable.isDragging}
          sortableHandleProps={
            sortable ? { ...folderSortable.attributes, ...folderSortable.listeners } : undefined
          }
        />
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
      </div>
    </div>
  );
}
