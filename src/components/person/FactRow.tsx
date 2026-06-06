import { useMemo, useState } from "react";
import type { Channel, Fact, FactFolder } from "../../types";
import { FACT_DRAG_MIME } from "../../lib/factFolders";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EntryRow } from "../ui/EntryRow";
import { InlineEditor } from "../ui/InlineEditor";
import type { RowMenuItem } from "../ui/RowMenu";

export function FactRow({
  fact,
  folders = [],
  draggable = false,
  onDragStart,
  onDragEnd,
  onPin,
  onDelete,
  onEdit,
  onMoveToFolder,
}: {
  fact: Fact;
  folders?: FactFolder[];
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onPin: () => void;
  onDelete: () => void;
  onEdit: (text: string, channel: Channel) => void;
  onMoveToFolder?: (folderId: string | null) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const menuItems = useMemo((): RowMenuItem[] => {
    const items: RowMenuItem[] = [
      { label: "Edit", onClick: () => setEditing(true) },
      { label: fact.pinned ? "Unpin" : "Pin", onClick: onPin },
    ];

    if (onMoveToFolder && folders.length > 0) {
      for (const folder of folders) {
        if (folder.id === fact.folderId) continue;
        items.push({
          label: `Move to ${folder.name}`,
          onClick: () => onMoveToFolder(folder.id),
        });
      }
      if (fact.folderId) {
        items.push({
          label: "Move to Unsorted",
          onClick: () => onMoveToFolder(null),
        });
      }
    }

    items.push({ label: "Delete", onClick: () => setConfirmDelete(true), destructive: true });
    return items;
  }, [fact.folderId, fact.pinned, folders, onMoveToFolder, onPin]);

  const dragHandle =
    draggable && !editing ? (
      <button
        type="button"
        draggable
        aria-label="Drag to move"
        className="mt-0.5 shrink-0 cursor-grab touch-none rounded px-0.5 text-stone-300 active:cursor-grabbing hover:text-stone-500"
        onDragStart={(e) => {
          e.dataTransfer.setData(FACT_DRAG_MIME, fact.id);
          e.dataTransfer.effectAllowed = "move";
          setDragging(true);
          onDragStart?.();
        }}
        onDragEnd={() => {
          setDragging(false);
          onDragEnd?.();
        }}
      >
        ⠿
      </button>
    ) : null;

  if (editing) {
    return (
      <div className="py-2 pl-2">
        <InlineEditor
          text={fact.text}
          channel={fact.channel}
          showChannel={false}
          onSave={(text, channel) => {
            onEdit(text, channel);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div className={dragging ? "opacity-40" : undefined}>
        <EntryRow
          leading={dragHandle}
          text={fact.text}
          timestampIso={fact.recordedAtIso}
          pinned={fact.pinned}
          menuItems={menuItems}
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete fact?"
        message="This fact will be permanently removed."
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
