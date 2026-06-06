import { useMemo, useState } from "react";
import type { Channel, Fact } from "../../types";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EntryRow } from "../ui/EntryRow";
import { InlineEditor } from "../ui/InlineEditor";

export function FactRow({
  fact,
  onPin,
  onDelete,
  onEdit,
}: {
  fact: Fact;
  onPin: () => void;
  onDelete: () => void;
  onEdit: (text: string, channel: Channel) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  const menuItems = useMemo(
    () => [
      { label: "Edit", onClick: () => setEditing(true) },
      { label: fact.pinned ? "Unpin" : "Pin", onClick: onPin },
      { label: "Delete", onClick: () => setConfirmDelete(true), destructive: true },
    ],
    [fact.pinned, onPin],
  );

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
      <EntryRow
        text={fact.text}
        timestampIso={fact.recordedAtIso}
        pinned={fact.pinned}
        menuItems={menuItems}
      />

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
