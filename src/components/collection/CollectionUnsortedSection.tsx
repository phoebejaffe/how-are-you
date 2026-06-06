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
      className={`mb-2 rounded-lg bg-stone-100/80 py-1 transition-shadow ${
        sortable.isDragging ? "opacity-40" : ""
      } ${droppable.isOver ? "ring-2 ring-sage/60" : ""} ${itemCount === 0 ? "min-h-12" : ""}`}
    >
      <UnsortedFolderHeader
        label={label}
        count={itemCount}
        isFolderReorderTarget={sortable.isOver && !sortable.isDragging}
        sortableHandleProps={{ ...sortable.attributes, ...sortable.listeners }}
        flush
      />
      <div className="flex flex-col gap-y-2 pl-3">{children}</div>
    </div>
  );
}
