import { useState, type DragEvent } from "react";
import type { Channel, Fact, FactFolder } from "../../types";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { RowMenu, type RowMenuItem } from "../ui/RowMenu";
import { FactRow } from "./FactRow";

export function FactFolderSection({
  folder,
  facts,
  allFolders,
  isDropTarget,
  onToggleCollapsed,
  onRename,
  onDelete,
  onPin,
  onDeleteFact,
  onEdit,
  onMoveToFolder,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  folder: FactFolder;
  facts: Fact[];
  allFolders: FactFolder[];
  isDropTarget: boolean;
  onToggleCollapsed: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onPin: (factId: string) => void;
  onDeleteFact: (factId: string) => void;
  onEdit: (factId: string, text: string, channel: Channel) => void;
  onMoveToFolder: (factId: string, folderId: string | null) => void;
  onDragStart: (factId: string) => void;
  onDragEnd: () => void;
  onDragOver: (targetId: string) => void;
  onDragLeave: (targetId: string) => void;
  onDrop: (targetId: string) => void;
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

  const dropHandlers = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      onDragOver(folder.id);
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        onDragLeave(folder.id);
      }
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      onDrop(folder.id);
    },
  };

  return (
    <div
      className={`mb-2 rounded-lg transition-shadow ${isDropTarget ? "ring-2 ring-sage/60" : ""}`}
      {...dropHandlers}
    >
      <div className="flex items-center gap-1 px-1">
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
            onDragStart={() => onDragStart(fact.id)}
            onDragEnd={onDragEnd}
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
