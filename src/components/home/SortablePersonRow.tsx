import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Person } from "../../types";
import { personDragId } from "../dnd/dndIds";
import { PersonListRow } from "./PersonListRow";

export function SortablePersonRow({
  person,
  onDelete,
}: {
  person: Person;
  onDelete?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: personDragId(person.nameKey),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-10 opacity-40" : ""}>
      <PersonListRow
        person={person}
        onDelete={onDelete}
        sortableHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
