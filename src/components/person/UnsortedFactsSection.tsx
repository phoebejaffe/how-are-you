import type { DragEvent } from "react";
import type { Channel, Fact, FactFolder } from "../../types";
import { FOLDER_DRAG_MIME, UNSORTED_DROP_ID } from "../../lib/factFolders";
import { FactRow } from "./FactRow";

export function UnsortedFactsSection({
  facts,
  folders,
  isFactDragging,
  isFactDropTarget,
  isFolderReorderTarget,
  isFolderDragging,
  onPin,
  onDeleteFact,
  onEdit,
  onMoveToFolder,
  onFactDragStart,
  onFactDragEnd,
  onFactDragOver,
  onFactDragLeave,
  onFactDrop,
  onFolderDragStart,
  onFolderDragEnd,
  onFolderDragOver,
  onFolderDragLeave,
  onFolderDrop,
}: {
  facts: Fact[];
  folders: FactFolder[];
  isFactDragging: boolean;
  isFactDropTarget: boolean;
  isFolderReorderTarget: boolean;
  isFolderDragging: boolean;
  onPin: (factId: string) => void;
  onDeleteFact: (factId: string) => void;
  onEdit: (factId: string, text: string, channel: Channel) => void;
  onMoveToFolder: (factId: string, folderId: string | null) => void;
  onFactDragStart: (factId: string) => void;
  onFactDragEnd: () => void;
  onFactDragOver: (targetId: string) => void;
  onFactDragLeave: (targetId: string) => void;
  onFactDrop: (targetId: string) => void;
  onFolderDragStart: (folderId: string) => void;
  onFolderDragEnd: () => void;
  onFolderDragOver: (targetId: string) => void;
  onFolderDragLeave: (targetId: string) => void;
  onFolderDrop: (targetId: string) => void;
}) {
  const emptyDropZone = facts.length === 0 && isFactDragging;

  const factDropHandlers = isFactDragging
    ? {
        onDragOver: (e: DragEvent) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          onFactDragOver(UNSORTED_DROP_ID);
        },
        onDragLeave: (e: DragEvent) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            onFactDragLeave(UNSORTED_DROP_ID);
          }
        },
        onDrop: (e: DragEvent) => {
          e.preventDefault();
          onFactDrop(UNSORTED_DROP_ID);
        },
      }
    : {};

  return (
    <div
      className={`mb-2 rounded-lg bg-stone-100/80 px-1 py-1 transition-shadow ${
        emptyDropZone ? "min-h-12" : ""
      } ${isFolderDragging ? "opacity-40" : ""} ${isFactDropTarget ? "ring-2 ring-sage/60" : ""}`}
      {...factDropHandlers}
    >
      <div
        className={`flex items-center gap-1 px-1 ${isFolderReorderTarget ? "rounded ring-2 ring-amber-400/80" : ""}`}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes(FOLDER_DRAG_MIME)) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "move";
          onFolderDragOver(UNSORTED_DROP_ID);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            onFolderDragLeave(UNSORTED_DROP_ID);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onFolderDrop(UNSORTED_DROP_ID);
        }}
      >
        <button
          type="button"
          draggable
          aria-label="Drag to reorder Unsorted"
          className="shrink-0 cursor-grab touch-none rounded px-0.5 text-stone-300 active:cursor-grabbing hover:text-stone-500"
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData(FOLDER_DRAG_MIME, UNSORTED_DROP_ID);
            e.dataTransfer.effectAllowed = "move";
            onFolderDragStart(UNSORTED_DROP_ID);
          }}
          onDragEnd={() => onFolderDragEnd()}
        >
          ⠿
        </button>
        <p className="min-w-0 flex-1 truncate px-1 py-0.5 text-xs font-semibold text-stone-500">
          Unsorted ({facts.length})
        </p>
      </div>
      {facts.map((fact) => (
        <FactRow
          key={fact.id}
          fact={fact}
          folders={folders}
          draggable
          onDragStart={() => onFactDragStart(fact.id)}
          onDragEnd={onFactDragEnd}
          onPin={() => onPin(fact.id)}
          onDelete={() => onDeleteFact(fact.id)}
          onEdit={(text, ch) => onEdit(fact.id, text, ch)}
          onMoveToFolder={(folderId) => onMoveToFolder(fact.id, folderId)}
        />
      ))}
    </div>
  );
}
