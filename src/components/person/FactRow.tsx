import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import type { Channel, Fact, FactFolder } from "../../types";
import { factDragId, type FactDragData } from "../dnd/dndIds";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EntryRow } from "../ui/EntryRow";
import { InlineEditor } from "../ui/InlineEditor";
import { copyMenuItem } from "../../lib/clipboard";
import type { RowMenuItem } from "../ui/RowMenu";

export function FactRow({
  fact,
  folders = [],
  draggable = false,
  onPin,
  onDelete,
  onEdit,
  onMoveToFolder,
}: {
  fact: Fact;
  folders?: FactFolder[];
  draggable?: boolean;
  onPin: () => void;
  onDelete: () => void;
  onEdit: (text: string, channel: Channel) => void;
  onMoveToFolder?: (folderId: string | null) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: factDragId(fact.id),
    data: { type: "fact", factId: fact.id } satisfies FactDragData,
    disabled: !draggable || editing,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const menuItems = useMemo((): RowMenuItem[] => {
    const items: RowMenuItem[] = [
      copyMenuItem(fact.text),
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
  }, [fact.folderId, fact.pinned, fact.text, folders, onMoveToFolder, onPin]);

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
      <div
        ref={setNodeRef}
        style={style}
        className={`touch-none select-none ${isDragging ? "z-10 opacity-40" : ""}`}
        {...(draggable ? listeners : {})}
        {...(draggable ? attributes : {})}
      >
        <EntryRow
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
