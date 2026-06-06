import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Channel, Fact, FactFolder } from "../../types";
import { factDragId, type FactDragData } from "../dnd/dndIds";
import { FactCollectionItem } from "./FactCollectionItem";

export function SortableFactItem({
  fact,
  folders = [],
  onPin,
  onDelete,
  onEdit,
  onMoveToFolder,
}: {
  fact: Fact;
  folders?: FactFolder[];
  onPin: () => void;
  onDelete: () => void;
  onEdit: (text: string, channel: Channel) => void;
  onMoveToFolder?: (folderId: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: factDragId(fact.id),
    data: { type: "fact", factId: fact.id } satisfies FactDragData,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-10 opacity-40" : ""}>
      <FactCollectionItem
        fact={fact}
        folders={folders}
        onPin={onPin}
        onDelete={onDelete}
        onEdit={onEdit}
        onMoveToFolder={onMoveToFolder}
        sortableHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
