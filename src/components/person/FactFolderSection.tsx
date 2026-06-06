import { useState, type DragEvent } from "react";
import type { Channel, Fact, FactFolder } from "../../types";
import { FOLDER_DRAG_MIME } from "../../lib/factFolders";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { RowMenu, type RowMenuItem } from "../ui/RowMenu";
import { FactRow } from "./FactRow";

export function FactFolderSection({
  folder,
  facts,
  allFolders,
  isFactDragging,
  isFactDropTarget,
  isFolderReorderTarget,
  isFolderDragging,
  onToggleCollapsed,
  onRename,
  onDelete,
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
  folder: FactFolder;
  facts: Fact[];
  allFolders: FactFolder[];
  isFactDragging: boolean;
  isFactDropTarget: boolean;
  isFolderReorderTarget: boolean;
  isFolderDragging: boolean;
  onToggleCollapsed: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
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
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(folder.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const menuItems: RowMenuItem[] = [
    {
      label: "Rename",
      onClick: () => {
        setNameInput(folder.name);
        setEditingName(true);
      },
    },
    { label: "Delete folder", onClick: () => setConfirmDelete(true), destructive: true },
  ];

  const factDropHandlers = isFactDragging
    ? {
        onDragOver: (e: DragEvent) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          onFactDragOver(folder.id);
        },
        onDragLeave: (e: DragEvent) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            onFactDragLeave(folder.id);
          }
        },
        onDrop: (e: DragEvent) => {
          e.preventDefault();
          onFactDrop(folder.id);
        },
      }
    : {};

  return (
    <div
      className={`mb-2 rounded-lg transition-shadow ${
        isFolderDragging ? "opacity-40" : ""
      } ${isFactDropTarget ? "ring-2 ring-sage/60" : ""}`}
      {...factDropHandlers}
    >
      <div
        className={`flex items-center gap-1 px-1 ${isFolderReorderTarget ? "rounded ring-2 ring-amber-400/80" : ""}`}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes(FOLDER_DRAG_MIME)) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "move";
          onFolderDragOver(folder.id);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            onFolderDragLeave(folder.id);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onFolderDrop(folder.id);
        }}
      >
        {editingName ? (
          <form
            className="flex min-w-0 flex-1 items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = nameInput.trim();
              if (!trimmed) return;
              onRename(trimmed);
              setEditingName(false);
            }}
          >
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="min-w-0 flex-1 rounded border border-stone-300 bg-white/80 px-2 py-0.5 text-xs"
              autoFocus
            />
            <button type="submit" className="rounded bg-sage px-2 py-0.5 text-xs text-white">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingName(false);
                setNameInput(folder.name);
              }}
              className="rounded px-2 py-0.5 text-xs text-stone-500"
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <button
              type="button"
              draggable
              aria-label="Drag to reorder folder"
              className="shrink-0 cursor-grab touch-none rounded px-0.5 text-stone-300 active:cursor-grabbing hover:text-stone-500"
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData(FOLDER_DRAG_MIME, folder.id);
                e.dataTransfer.effectAllowed = "move";
                onFolderDragStart(folder.id);
              }}
              onDragEnd={() => onFolderDragEnd()}
            >
              ⠿
            </button>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="flex min-w-0 flex-1 cursor-pointer items-center justify-between rounded px-1 py-0.5 text-left text-xs font-semibold text-stone-600 hover:text-stone-800"
            >
              <span className="truncate">
                {folder.name} ({facts.length})
              </span>
              <span className="shrink-0 pl-2">{folder.collapsed ? "▸" : "▾"}</span>
            </button>
            <RowMenu items={menuItems} />
          </>
        )}
      </div>

      {!folder.collapsed &&
        facts.map((fact) => (
          <FactRow
            key={fact.id}
            fact={fact}
            folders={allFolders}
            draggable
            onDragStart={() => onFactDragStart(fact.id)}
            onDragEnd={onFactDragEnd}
            onPin={() => onPin(fact.id)}
            onDelete={() => onDeleteFact(fact.id)}
            onEdit={(text, ch) => onEdit(fact.id, text, ch)}
            onMoveToFolder={(folderId) => onMoveToFolder(fact.id, folderId)}
          />
        ))}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete folder?"
        message="Facts in this folder will be moved to Unsorted, not deleted."
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
