import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UNSORTED_DROP_ID } from "../../lib/folders";
import { sortPeopleInFolder } from "../../lib/personOrder";
import type { Person } from "../../types";
import { folderDropId, folderSortId, personDragId, type FolderDropData, type FolderSortData } from "../dnd/dndIds";
import { mergeRefs } from "../dnd/mergeRefs";
import { UnsortedFolderHeader } from "../folders/FolderHeader";
import { SortablePersonRow } from "./SortablePersonRow";

export function UnsortedPeopleSection({
  people,
  onDeletePerson,
  sortable = true,
  highlightDropTarget = false,
}: {
  people: Person[];
  onDeletePerson: (nameKey: string) => void;
  sortable?: boolean;
  highlightDropTarget?: boolean;
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

  const sortStyle = {
    transform: CSS.Translate.toString(folderSortable.transform),
  };

  return (
    <div
      ref={mergeRefs(folderSortable.setNodeRef, droppable.setNodeRef)}
      style={sortStyle}
      className={`folder-card-unsorted rounded-md px-0.5 py-0.5 transition-shadow ${
        folderSortable.isDragging ? "opacity-40" : ""
      } ${highlightDropTarget ? "ring-2 ring-sage/50" : ""}`}
    >
      <UnsortedFolderHeader
        label="Unsorted"
        count={people.length}
        isFolderReorderTarget={folderSortable.isOver && !folderSortable.isDragging}
        sortableHandleRef={sortable ? folderSortable.setActivatorNodeRef : undefined}
        sortableHandleProps={
          sortable ? { ...folderSortable.attributes, ...folderSortable.listeners } : undefined
        }
        flush
        showBottomBorder={people.length > 0}
      />
      <div className={people.length === 0 ? "min-h-11" : ""}>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <ul className="list-divider pb-0.5">
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
