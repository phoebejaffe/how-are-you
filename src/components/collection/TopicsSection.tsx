import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import type { Channel, FollowUp, Topic } from "../../types";
import { topicIdFromSortId, topicSortId, isTopicSortId } from "../dnd/dndIds";
import { useAppDndSensors } from "../dnd/dndSensors";
import { ChannelPicker } from "../ui/ChannelPicker";
import { SectionAddLink } from "../ui/SectionAddLink";
import { SortableTopicItem } from "./SortableTopicItem";
import { TopicCollectionItem } from "./TopicCollectionItem";

export function TopicsSection({
  topics,
  followUps,
  pendingFollowUpDeletes,
  archivedTopics,
  topicHighlighted,
  followUpHighlighted,
  onClusterSelect,
  onAddTopic,
  onPin,
  onArchive,
  onUnarchive,
  onDelete,
  onEdit,
  onAddFollowUp,
  onEditFollowUp,
  onDeleteFollowUp,
  onReorderTopics,
}: {
  topics: Topic[];
  followUps: FollowUp[];
  pendingFollowUpDeletes: Set<string>;
  archivedTopics: Topic[];
  topicHighlighted?: (topicId: string) => boolean;
  followUpHighlighted?: (followUpId: string) => boolean;
  onClusterSelect?: (timestampIso: string) => void;
  onAddTopic: (text: string, channel: Channel) => void;
  onPin: (topicId: string) => void;
  onArchive: (topicId: string) => void;
  onUnarchive: (topicId: string) => void;
  onDelete: (topicId: string) => void;
  onEdit: (topicId: string, text: string, channel: Channel) => void;
  onAddFollowUp: (topicId: string, text: string, channel: Channel) => void;
  onEditFollowUp: (followUpId: string, text: string, channel: Channel) => void;
  onDeleteFollowUp: (followUpId: string) => void;
  onReorderTopics: (draggedId: string, targetId: string) => void;
}) {
  const sensors = useAppDndSensors();
  const [topicText, setTopicText] = useState("");
  const [topicChannel, setTopicChannel] = useState<Channel>("call");
  const [addingTopic, setAddingTopic] = useState(false);
  const [showArchived, setShowArchived] = useState(true);

  const sortableIds = useMemo(() => topics.map((t) => topicSortId(t.id)), [topics]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (!isTopicSortId(activeId) || !isTopicSortId(overId) || activeId === overId) return;
    onReorderTopics(topicIdFromSortId(activeId), topicIdFromSortId(overId));
  }

  function renderArchivedTopic(topic: Topic) {
    return (
      <TopicCollectionItem
        key={topic.id}
        topic={topic}
        followUps={followUps}
        archived
        topicHighlighted={topicHighlighted?.(topic.id)}
        followUpHighlighted={followUpHighlighted}
        onClusterSelect={onClusterSelect}
        onPin={() => onPin(topic.id)}
        onArchive={() => onArchive(topic.id)}
        onUnarchive={() => onUnarchive(topic.id)}
        onDelete={() => onDelete(topic.id)}
        onEdit={(text, ch) => onEdit(topic.id, text, ch)}
        onAddFollowUp={(text, ch) => onAddFollowUp(topic.id, text, ch)}
        onEditFollowUp={onEditFollowUp}
        onDeleteFollowUp={onDeleteFollowUp}
        pendingFollowUpDeletes={pendingFollowUpDeletes}
      />
    );
  }

  return (
    <>
      <section className="mb-3">
        <div className="mb-1 flex items-baseline gap-2 pr-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-stone-600">Topics</h2>
          {!addingTopic && <SectionAddLink onClick={() => setAddingTopic(true)}>add a topic</SectionAddLink>}
        </div>

        {addingTopic && (
          <AddTopicForm
            topicText={topicText}
            topicChannel={topicChannel}
            onTextChange={setTopicText}
            onChannelChange={setTopicChannel}
            onSubmit={() => {
              onAddTopic(topicText, topicChannel);
              setTopicText("");
              setAddingTopic(false);
            }}
            onCancel={() => {
              setTopicText("");
              setAddingTopic(false);
            }}
          />
        )}

        <div className="rounded-lg bg-white/40 px-1 py-1">
          {topics.length === 0 && (
            <p className="px-2 py-2 text-center text-xs text-stone-400">No active topics.</p>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {topics.map((topic) => (
                <SortableTopicItem
                  key={topic.id}
                  topic={topic}
                  followUps={followUps}
                  pendingFollowUpDeletes={pendingFollowUpDeletes}
                  topicHighlighted={topicHighlighted?.(topic.id)}
                  followUpHighlighted={followUpHighlighted}
                  onClusterSelect={onClusterSelect}
                  onPin={() => onPin(topic.id)}
                  onArchive={() => onArchive(topic.id)}
                  onDelete={() => onDelete(topic.id)}
                  onEdit={(text, ch) => onEdit(topic.id, text, ch)}
                  onAddFollowUp={(text, ch) => onAddFollowUp(topic.id, text, ch)}
                  onEditFollowUp={onEditFollowUp}
                  onDeleteFollowUp={onDeleteFollowUp}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </section>

      <section>
        <button
          type="button"
          onClick={() => setShowArchived((s) => !s)}
          className="mb-1 flex min-h-10 w-full items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-wide text-stone-400 active:text-stone-600"
        >
          <span>Archived ({archivedTopics.length})</span>
          <span>{showArchived ? "▾" : "▸"}</span>
        </button>
        {showArchived && archivedTopics.length > 0 && (
          <div className="rounded-lg bg-stone-100/50 px-1 py-1">
            {archivedTopics.map((topic) => renderArchivedTopic(topic))}
          </div>
        )}
      </section>
    </>
  );
}

function AddTopicForm({
  topicText,
  topicChannel,
  onTextChange,
  onChannelChange,
  onSubmit,
  onCancel,
}: {
  topicText: string;
  topicChannel: Channel;
  onTextChange: (value: string) => void;
  onChannelChange: (value: Channel) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="my-1 flex flex-wrap items-center gap-1 px-1"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = topicText.trim();
        if (!trimmed) return;
        onSubmit();
      }}
    >
      <input
        value={topicText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="add a topic"
        className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white/80 px-3 py-1.5 text-sm"
        autoFocus
      />
      <ChannelPicker value={topicChannel} onChange={onChannelChange} />
      <button type="submit" className="rounded-lg bg-sage px-3 py-1.5 text-sm text-white hover:bg-sage-dark">
        Add
      </button>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel"
        className="rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-100"
      >
        X
      </button>
    </form>
  );
}
