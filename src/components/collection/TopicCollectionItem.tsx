import { useEffect, useMemo, useState, type HTMLAttributes } from "react";
import type { Channel, FollowUp, Topic, TopicFolder } from "../../types";
import {
  isTopicFollowUpsCollapsed,
  setTopicFollowUpsCollapsed,
} from "../../lib/topicFollowUpCollapse";
import { ChannelPicker } from "../ui/ChannelPicker";
import { SectionAddLink } from "../ui/SectionAddLink";
import { CollectionItemRow } from "./CollectionItemRow";
import { FOLLOW_UP_ITEM_FEATURES, TOPIC_ITEM_FEATURES } from "./itemFeatures";
import type { CollectionFolderRef } from "./types";

export function TopicCollectionItem({
  topic,
  folders = [],
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
  onMoveToFolder,
  pendingFollowUpDeletes,
  topicHighlighted = false,
  followUpHighlighted,
  onClusterSelect,
  sortableHandleProps,
  pinnedStrip = false,
}: {
  topic: Topic;
  folders?: TopicFolder[];
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
  onMoveToFolder?: (folderId: string | null) => void;
  pendingFollowUpDeletes: Set<string>;
  topicHighlighted?: boolean;
  followUpHighlighted?: (followUpId: string) => boolean;
  onClusterSelect?: (timestampIso: string) => void;
  sortableHandleProps?: HTMLAttributes<HTMLElement>;
  pinnedStrip?: boolean;
}) {
  const [followUpText, setFollowUpText] = useState("");
  const [followUpChannel, setFollowUpChannel] = useState<Channel>("call");
  const [addingFollowUp, setAddingFollowUp] = useState(false);
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
  const folderRefs: CollectionFolderRef[] = folders.map((f) => ({ id: f.id, name: f.name }));
  const showPinnedStyle = topic.pinned && !archived && !pinnedStrip;
  const followUpActionLinkClass = `border-l-2 pl-2 ${archived ? "border-stone-200" : "border-sage/40"}`;

  useEffect(() => {
    if (archived) {
      setFollowUpsExpanded(false);
      setTopicFollowUpsCollapsed(topic.id, true);
    }
  }, [archived, topic.id]);

  function toggleFollowUps() {
    if (!canShowFollowUpSection || !TOPIC_ITEM_FEATURES.collapsible) return;
    const next = !followUpsExpanded;
    setFollowUpsExpanded(next);
    setTopicFollowUpsCollapsed(topic.id, !next);
  }

  return (
    <div
      className={`rounded-lg ${showPinnedStyle ? "bg-amber-50/80 px-1 ring-1 ring-amber-200/50" : ""}`}
    >
      <CollectionItemRow
        text={topic.text}
        timestampIso={topic.createdAtIso}
        channel={topic.channel}
        pinned={topic.pinned}
        archived={archived}
        highlighted={topicHighlighted}
        features={{
          ...TOPIC_ITEM_FEATURES,
          pin: !archived,
          archive: !archived,
          unarchive: archived,
          moveToFolder: Boolean(!archived && onMoveToFolder && folders.length > 0),
        }}
        folders={folderRefs}
        currentFolderId={topic.folderId ?? null}
        menuActions={{
          onEdit: () => {},
          onPin,
          onArchive,
          onUnarchive,
          onMoveToFolder,
          onDelete,
        }}
        editChannel={topic.channel}
        onSaveEdit={onEdit}
        deleteTitle="Delete topic?"
        deleteMessage="This will permanently remove the topic and its follow-ups."
        disclosureCollapsed={canShowFollowUpSection && !followUpsExpanded}
        disclosureCount={topicFollowUps.length}
        onRowClick={canShowFollowUpSection ? toggleFollowUps : undefined}
        onClusterSelect={onClusterSelect}
        sortableHandleProps={archived ? undefined : sortableHandleProps}
      />

      {followUpsExpanded && canShowFollowUpSection && (
        <div className="space-y-0">
          {needsFollowUpCollapse && !showAllFollowUps && (
            <div className={`${followUpActionLinkClass} py-0.5 leading-none`}>
              <SectionAddLink compact prefix="..." onClick={() => setShowAllFollowUps(true)}>
                show {hiddenFollowUpCount} more
              </SectionAddLink>
            </div>
          )}
          {needsFollowUpCollapse && showAllFollowUps && (
            <div className={`${followUpActionLinkClass} py-0.5 leading-none`}>
              <SectionAddLink compact prefix="..." onClick={() => setShowAllFollowUps(false)}>
                show less
              </SectionAddLink>
            </div>
          )}
          {displayedFollowUps.map((followUp) => (
            <div key={followUp.id} className={followUpItemClass}>
              <CollectionItemRow
                text={followUp.text}
                timestampIso={followUp.recordedAtIso}
                channel={followUp.channel}
                archived={archived}
                highlighted={followUpHighlighted?.(followUp.id) ?? false}
                compact
                features={FOLLOW_UP_ITEM_FEATURES}
                menuActions={{
                  onEdit: () => {},
                  onDelete: () => onDeleteFollowUp(followUp.id),
                }}
                editChannel={followUp.channel}
                editCompact
                onSaveEdit={(text, channel) => onEditFollowUp(followUp.id, text, channel)}
                deleteTitle="Delete follow-up?"
                deleteMessage="This follow-up will be permanently removed."
                onClusterSelect={onClusterSelect}
              />
            </div>
          ))}
          {!archived && !addingFollowUp && (
            <div className={`${followUpActionLinkClass} py-0.5 leading-none`}>
              <SectionAddLink compact onClick={() => setAddingFollowUp(true)}>
                followup
              </SectionAddLink>
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

    </div>
  );
}
