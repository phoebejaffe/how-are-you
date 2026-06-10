import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Person } from "../../types";
import { personDragId } from "../dnd/dndIds";
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
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: personDragId(person.nameKey),
      disabled: !sortable,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!sortable) {
    return <PersonListRow person={person} onDelete={onDelete} />;
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-10 opacity-40" : ""}>
      <PersonListRow
        person={person}
        onDelete={onDelete}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
