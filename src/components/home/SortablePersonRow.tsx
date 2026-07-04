import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Person } from "../../types";
import { personDragId, type PersonDragData } from "../dnd/dndIds";
import { PersonListRow } from "./PersonListRow";

export function SortablePersonRow({
  person,
  onDelete,
  sortable = true,
}: {
  person: Person;
  onDelete?: () => void;
  sortable?: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } =
    useSortable({
      id: personDragId(person.nameKey),
      data: {
        type: "person",
        nameKey: person.nameKey,
        folderId: person.folderId ?? null,
      } satisfies PersonDragData,
      disabled: !sortable,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  if (!sortable) {
    return <PersonListRow person={person} onDelete={onDelete} />;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-person-drag-row=""
      className={isDragging ? "pointer-events-none opacity-0" : ""}
    >
      <PersonListRow
        person={person}
        onDelete={onDelete}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
