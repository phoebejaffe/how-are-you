import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { UNSORTED_DROP_ID } from "../../lib/folders";
import { folderDropId, folderSortId, type FolderDropData, type FolderSortData } from "../dnd/dndIds";
import { UnsortedFolderHeader } from "../folders/FolderHeader";
import { mergeRefs } from "../dnd/mergeRefs";

export function CollectionUnsortedSection({
  label,
  itemCount,
  children,
}: {
  label: string;
  itemCount: number;
  children: ReactNode;
}) {
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
      className={`folder-card-unsorted px-1 py-1 transition-shadow ${
        sortable.isDragging ? "opacity-40" : ""
      } ${droppable.isOver ? "ring-2 ring-sage/50" : ""} ${itemCount === 0 ? "min-h-14" : ""}`}
    >
      <UnsortedFolderHeader
        label={label}
        count={itemCount}
        isFolderReorderTarget={sortable.isOver && !sortable.isDragging}
        sortableHandleRef={sortable.setActivatorNodeRef}
        sortableHandleProps={{ ...sortable.attributes, ...sortable.listeners }}
        flush
      />
      <div className="flex flex-col gap-y-1 px-2 pb-2">{children}</div>
    </div>
  );
}
