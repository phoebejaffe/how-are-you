import { useEffect, useMemo, useState } from "react";
import type { Channel, FollowUp, Topic } from "../../types";
import {
  isTopicFollowUpsCollapsed,
  setTopicFollowUpsCollapsed,
} from "../../lib/topicFollowUpCollapse";
import { ChannelPicker } from "../ui/ChannelPicker";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EntryRow } from "../ui/EntryRow";
import { InlineEditor } from "../ui/InlineEditor";
import { copyMenuItem } from "../../lib/clipboard";
import type { RowMenuItem } from "../ui/RowMenu";
import { SectionAddLink } from "../ui/SectionAddLink";
import { TextActionLink } from "../ui/TextActionLink";

export function TopicRow({
  topic,
  followUps,
  archived = false,
  onPin,
  onArchive,
  onUnarchive,
  onDelete,
  onEdit,
  onAddFollowUp,
  onEditFollowUp,
  onDeleteFollowUp,
  pendingFollowUpDeletes,
  topicHighlighted = false,
  followUpHighlighted,
  onClusterSelect,
}: {
  topic: Topic;
  followUps: FollowUp[];
  archived?: boolean;
  onPin: () => void;
  onArchive: () => void;
  onUnarchive?: () => void;
  onDelete: () => void;
  onEdit: (text: string, channel: Channel) => void;
  onAddFollowUp: (text: string, channel: Channel) => void;
  onEditFollowUp: (followUpId: string, text: string, channel: Channel) => void;
  onDeleteFollowUp: (followUpId: string) => void;
  pendingFollowUpDeletes: Set<string>;
  topicHighlighted?: boolean;
  followUpHighlighted?: (followUpId: string) => boolean;
  onClusterSelect?: (timestampIso: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(null);
  const [followUpText, setFollowUpText] = useState("");
  const [followUpChannel, setFollowUpChannel] = useState<Channel>("call");
  const [addingFollowUp, setAddingFollowUp] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteFollowUpId, setConfirmDeleteFollowUpId] = useState<string | null>(null);
  const [showAllFollowUps, setShowAllFollowUps] = useState(false);
  const [followUpsExpanded, setFollowUpsExpanded] = useState(
    () => !archived && !isTopicFollowUpsCollapsed(topic.id),
  );

  const topicFollowUps = useMemo(
    () =>
      followUps
        .filter((f) => f.topicId === topic.id && !pendingFollowUpDeletes.has(f.id))
        .sort((a, b) => a.recordedAtIso.localeCompare(b.recordedAtIso)),
    [followUps, topic.id, pendingFollowUpDeletes],
  );
  const canShowFollowUpSection = topicFollowUps.length > 0 || !archived;
  const needsFollowUpCollapse = topicFollowUps.length > 5;
  const hiddenFollowUpCount = topicFollowUps.length - 4;
  const displayedFollowUps =
    needsFollowUpCollapse && !showAllFollowUps ? topicFollowUps.slice(-4) : topicFollowUps;

  const followUpItemClass = `border-l-2 pl-2 ${archived ? "border-stone-200" : "border-sage/40"}`;

  useEffect(() => {
    if (archived) {
      setFollowUpsExpanded(false);
      setTopicFollowUpsCollapsed(topic.id, true);
    }
  }, [archived, topic.id]);

  const topicMenuItems = useMemo((): RowMenuItem[] => {
    return [
      copyMenuItem(topic.text),
      { label: "Edit", onClick: () => setEditing(true) },
      ...(archived
        ? [{ label: "Unarchive", onClick: () => onUnarchive?.() }]
        : [
            { label: topic.pinned ? "Unpin" : "Pin", onClick: onPin },
            { label: "Archive", onClick: onArchive },
          ]),
      { label: "Delete", onClick: () => setConfirmDelete(true), destructive: true },
    ];
  }, [archived, onArchive, onPin, onUnarchive, topic.pinned, topic.text]);

  function toggleFollowUps() {
    if (!canShowFollowUpSection) return;
    const next = !followUpsExpanded;
    setFollowUpsExpanded(next);
    setTopicFollowUpsCollapsed(topic.id, !next);
  }

  function followUpMenuItems(followUp: FollowUp): RowMenuItem[] {
    return [
      copyMenuItem(followUp.text),
      { label: "Edit", onClick: () => setEditingFollowUpId(followUp.id) },
      { label: "Delete", onClick: () => setConfirmDeleteFollowUpId(followUp.id), destructive: true },
    ];
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
        topic
        text={topic.text}
        timestampIso={topic.createdAtIso}
        channel={topic.channel}
        pinned={topic.pinned}
        menuItems={topicMenuItems}
        archived={archived}
        highlighted={topicHighlighted}
        disclosureCollapsed={canShowFollowUpSection && !followUpsExpanded}
        onRowClick={canShowFollowUpSection ? toggleFollowUps : undefined}
        onClusterSelect={onClusterSelect}
      />

      {followUpsExpanded && canShowFollowUpSection && (
        <div className="ml-4 space-y-0">
          {needsFollowUpCollapse && !showAllFollowUps && (
            <TextActionLink tone="accent" onClick={() => setShowAllFollowUps(true)}>
              Show {hiddenFollowUpCount} more
            </TextActionLink>
          )}
          {needsFollowUpCollapse && showAllFollowUps && (
            <TextActionLink onClick={() => setShowAllFollowUps(false)}>
              Show less
            </TextActionLink>
          )}
          {displayedFollowUps.map((f) =>
            editingFollowUpId === f.id ? (
              <div key={f.id} className={followUpItemClass}>
                <div className="py-0.5">
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
              </div>
            ) : (
              <div key={f.id} className={followUpItemClass}>
                <EntryRow
                  text={f.text}
                  timestampIso={f.recordedAtIso}
                  channel={f.channel}
                  menuItems={followUpMenuItems(f)}
                  archived={archived}
                  highlighted={followUpHighlighted?.(f.id) ?? false}
                  onClusterSelect={onClusterSelect}
                  compact
                />
              </div>
            ),
          )}
          {!archived && !addingFollowUp && (
            <div className={followUpItemClass}>
              <div className="pl-2">
                <SectionAddLink onClick={() => setAddingFollowUp(true)}>Record a followup</SectionAddLink>
              </div>
            </div>
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
                aria-label="Cancel"
                className="rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100"
              >
                X
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

      <ConfirmDialog
        open={confirmDeleteFollowUpId !== null}
        title="Delete follow-up?"
        message="This follow-up will be permanently removed."
        onConfirm={() => {
          if (confirmDeleteFollowUpId) onDeleteFollowUp(confirmDeleteFollowUpId);
          setConfirmDeleteFollowUpId(null);
        }}
        onCancel={() => setConfirmDeleteFollowUpId(null)}
      />
    </>
  );
}
