import { useMemo, useState } from "react";
import { formatRelativeTime } from "../../lib/dates";
import type { Channel, Fact } from "../../types";
import { ChannelBadge } from "../ui/ChannelBadge";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { InlineEditor } from "../ui/InlineEditor";
import { RowMenu } from "../ui/RowMenu";

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
      <div className="px-2 py-1">
        <InlineEditor
          text={fact.text}
          channel={fact.channel}
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
      <div className="flex min-h-8 items-center gap-2 rounded px-2 py-1 text-sm hover:bg-white/70">
        <span className="min-w-0 flex-1 truncate" title={fact.text}>
          {fact.pinned && <span className="mr-1 text-amber-500" aria-label="Pinned">📌</span>}
          {fact.text}
        </span>
        <span className="shrink-0 text-[10px] text-stone-400">{formatRelativeTime(fact.recordedAtIso)}</span>
        <ChannelBadge channel={fact.channel} />
        <RowMenu items={menuItems} />
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
