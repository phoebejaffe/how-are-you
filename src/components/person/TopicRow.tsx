import { useMemo, useState } from "react";
import type { Channel, FollowUp, Topic } from "../../types";
import { ChannelPicker } from "../ui/ChannelPicker";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EntryRow } from "../ui/EntryRow";
import { InlineEditor } from "../ui/InlineEditor";
import type { RowMenuItem } from "../ui/RowMenu";

export function TopicRow({
  topic,
  followUps,
  archived = false,
  onPin,
  onArchive,
  onDelete,
  onEdit,
  onAddFollowUp,
  onEditFollowUp,
}: {
  topic: Topic;
  followUps: FollowUp[];
  archived?: boolean;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onEdit: (text: string, channel: Channel) => void;
  onAddFollowUp: (text: string, channel: Channel) => void;
  onEditFollowUp: (followUpId: string, text: string, channel: Channel) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(null);
  const [followUpText, setFollowUpText] = useState("");
  const [followUpChannel, setFollowUpChannel] = useState<Channel>("call");
  const [addingFollowUp, setAddingFollowUp] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAllFollowUps, setShowAllFollowUps] = useState(false);

  const topicFollowUps = useMemo(
    () =>
      followUps
        .filter((f) => f.topicId === topic.id)
        .sort((a, b) => a.recordedAtIso.localeCompare(b.recordedAtIso)),
    [followUps, topic.id],
  );
  const showFollowUps = topicFollowUps.length > 0 || !archived;
  const needsFollowUpCollapse = topicFollowUps.length > 5;
  const hiddenFollowUpCount = topicFollowUps.length - 4;
  const displayedFollowUps =
    needsFollowUpCollapse && !showAllFollowUps ? topicFollowUps.slice(-4) : topicFollowUps;

  const topicMenuItems = useMemo((): RowMenuItem[] => {
    return [
      { label: "Edit", onClick: () => setEditing(true) },
      ...(!archived
        ? [
            { label: topic.pinned ? "Unpin" : "Pin", onClick: onPin },
            { label: "Archive", onClick: onArchive },
          ]
        : []),
      { label: "Delete", onClick: () => setConfirmDelete(true), destructive: true },
    ];
  }, [archived, onArchive, onPin, topic.pinned]);

  function followUpMenuItems(followUpId: string): RowMenuItem[] {
    return [{ label: "Edit", onClick: () => setEditingFollowUpId(followUpId) }];
  }

  if (editing) {
    return (
      <div className="py-2 pl-2">
        <InlineEditor
          text={topic.text}
          channel={topic.channel}
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
        text={topic.text}
        timestampIso={topic.createdAtIso}
        channel={topic.channel}
        pinned={topic.pinned}
        menuItems={topicMenuItems}
        archived={archived}
      />

      {showFollowUps && (
        <div className={`ml-4 space-y-1 border-l-2 pl-3 ${archived ? "border-stone-200" : "border-sage/40"}`}>
          {needsFollowUpCollapse && !showAllFollowUps && (
            <button
              type="button"
              onClick={() => setShowAllFollowUps(true)}
              className="py-0.5 text-xs text-terracotta hover:underline"
            >
              Show {hiddenFollowUpCount} more
            </button>
          )}
          {needsFollowUpCollapse && showAllFollowUps && (
            <button
              type="button"
              onClick={() => setShowAllFollowUps(false)}
              className="py-0.5 text-xs text-stone-400 hover:underline"
            >
              Show less
            </button>
          )}
          {displayedFollowUps.map((f) =>
            editingFollowUpId === f.id ? (
              <div key={f.id} className="py-2 pl-2">
                <InlineEditor
                  compact
                  text={f.text}
                  channel={f.channel}
                  onSave={(text, channel) => {
                    onEditFollowUp(f.id, text, channel);
                    setEditingFollowUpId(null);
                  }}
                  onCancel={() => setEditingFollowUpId(null)}
                />
              </div>
            ) : (
              <EntryRow
                key={f.id}
                text={f.text}
                timestampIso={f.recordedAtIso}
                channel={f.channel}
                menuItems={followUpMenuItems(f.id)}
                archived={archived}
              />
            ),
          )}
          {!archived && !addingFollowUp && (
            <button
              type="button"
              onClick={() => setAddingFollowUp(true)}
              className="py-0.5 text-xs text-stone-400 hover:text-stone-600 hover:underline"
            >
              Add followup
            </button>
          )}
          {!archived && addingFollowUp && (
            <form
              className="flex flex-wrap items-center gap-1 py-2 pl-2"
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = followUpText.trim();
                if (!trimmed) return;
                onAddFollowUp(trimmed, followUpChannel);
                setFollowUpText("");
                setAddingFollowUp(false);
              }}
            >
              <input
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="Follow-up…"
                className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white/80 px-3 py-1.5 text-sm"
                autoFocus
              />
              <ChannelPicker value={followUpChannel} onChange={setFollowUpChannel} />
              <button type="submit" className="rounded-lg bg-sage px-3 py-1.5 text-sm text-white hover:bg-sage-dark">
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setFollowUpText("");
                  setAddingFollowUp(false);
                }}
                className="rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete topic?"
        message="This will permanently remove the topic and its follow-ups."
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
