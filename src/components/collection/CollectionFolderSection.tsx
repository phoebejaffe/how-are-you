import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type ReactNode } from "react";
import type { BaseFolder } from "../../lib/folders";
import { folderDropId, folderSortId, type FolderDropData, type FolderSortData } from "../dnd/dndIds";
import { FolderHeader } from "../folders/FolderHeader";
import { mergeRefs } from "../dnd/mergeRefs";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export function CollectionFolderSection({
  folder,
  itemCount,
  children,
  onToggleCollapsed,
  onRename,
  onDelete,
}: {
  folder: BaseFolder;
  itemCount: number;
  children: ReactNode;
  onToggleCollapsed: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      className={`mb-2 rounded-lg transition-shadow ${sortable.isDragging ? "opacity-40" : ""} ${
        droppable.isOver ? "ring-2 ring-sage/60" : ""
      }`}
    >
      <FolderHeader
        name={folder.name}
        count={itemCount}
        collapsed={folder.collapsed}
        isFolderReorderTarget={sortable.isOver && !sortable.isDragging}
        onToggleCollapsed={onToggleCollapsed}
        onRename={onRename}
        onDeleteRequest={() => setConfirmDelete(true)}
        sortableHandleProps={{ ...sortable.attributes, ...sortable.listeners }}
        flush
      />

      {!folder.collapsed && <div className="pl-3">{children}</div>}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete folder?"
        message="Items in this folder will be moved to Unsorted, not deleted."
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
