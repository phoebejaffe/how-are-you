import { useState } from "react";
import { formatRelativeTime } from "../../lib/dates";
import type { Channel, FollowUp, Topic } from "../../types";
import { ChannelBadge } from "../ui/ChannelBadge";
import { ChannelPicker } from "../ui/ChannelPicker";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { InlineEditor } from "../ui/InlineEditor";

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
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(null);
  const [followUpText, setFollowUpText] = useState("");
  const [followUpChannel, setFollowUpChannel] = useState<Channel>("call");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const topicFollowUps = followUps.filter((f) => f.topicId === topic.id);

  if (editing) {
    return (
      <div className="px-2 py-1">
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
      <div
        className={`group flex min-h-8 items-center gap-2 rounded px-2 py-1 text-sm ${
          archived ? "bg-stone-100/60 text-stone-500" : "hover:bg-white/70"
        }`}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="min-w-0 flex-1 truncate text-left"
          title={topic.text}
        >
          {topic.pinned && <span className="mr-1 text-amber-500" aria-label="Pinned">📌</span>}
          {topic.text}
        </button>
        <span className="shrink-0 text-[10px] text-stone-400">{formatRelativeTime(topic.createdAtIso)}</span>
        <ChannelBadge channel={topic.channel} />
        <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded p-0.5 text-xs hover:bg-stone-200"
            title="Edit"
          >
            ✎
          </button>
          {!archived && (
            <>
              <button type="button" onClick={onPin} className="rounded p-0.5 text-xs hover:bg-stone-200" title="Pin">
                📌
              </button>
              <button type="button" onClick={onArchive} className="rounded p-0.5 text-xs hover:bg-stone-200" title="Archive">
                📦
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded p-0.5 text-xs hover:bg-stone-200"
            title="Delete"
          >
            🗑
          </button>
        </div>
      </div>

      {expanded && (
        <div className={`ml-4 space-y-1 border-l-2 pl-3 ${archived ? "border-stone-200" : "border-sage/40"}`}>
          {topicFollowUps.map((f) =>
            editingFollowUpId === f.id ? (
              <div key={f.id} className="py-0.5">
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
              <div key={f.id} className="group/followup flex min-h-7 items-center gap-2 text-xs text-stone-600">
                <span className="min-w-0 flex-1 truncate" title={f.text}>
                  ↳ {f.text}
                </span>
                <span className="shrink-0 text-[10px] text-stone-400">{formatRelativeTime(f.recordedAtIso)}</span>
                <ChannelBadge channel={f.channel} />
                <button
                  type="button"
                  onClick={() => setEditingFollowUpId(f.id)}
                  className="shrink-0 rounded p-0.5 opacity-0 hover:bg-stone-200 group-hover/followup:opacity-100"
                  title="Edit"
                >
                  ✎
                </button>
              </div>
            ),
          )}
          {!archived && (
            <form
              className="flex gap-1 pt-1"
              onSubmit={(e) => {
                e.preventDefault();
                onAddFollowUp(followUpText, followUpChannel);
                setFollowUpText("");
              }}
            >
              <input
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="Add follow-up…"
                className="min-w-0 flex-1 rounded border border-stone-300 px-2 py-0.5 text-xs"
              />
              <ChannelPicker value={followUpChannel} onChange={setFollowUpChannel} />
              <button type="submit" className="rounded bg-sage px-2 py-0.5 text-xs text-white">
                Add
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
