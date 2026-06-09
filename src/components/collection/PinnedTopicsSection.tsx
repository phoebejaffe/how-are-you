import { closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { AppDndContext } from "../dnd/AppDndContext";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo } from "react";
import type { Channel, FollowUp, Topic, TopicFolder } from "../../types";
import { topicSortId, topicIdFromSortId, isTopicSortId } from "../dnd/dndIds";
import { useAppDndSensors } from "../dnd/dndSensors";
import { SortableTopicItem } from "./SortableTopicItem";

export function PinnedTopicsSection({
  topics,
  folders,
  followUps,
  pendingFollowUpDeletes,
  topicHighlighted,
  followUpHighlighted,
  onClusterSelect,
  onPin,
  onArchive,
  onDelete,
  onEdit,
  onAddFollowUp,
  onEditFollowUp,
  onDeleteFollowUp,
  onMoveToFolder,
  onReorderPinnedTopics,
}: {
  topics: Topic[];
  folders: TopicFolder[];
  followUps: FollowUp[];
  pendingFollowUpDeletes: Set<string>;
  topicHighlighted?: (topicId: string) => boolean;
  followUpHighlighted?: (followUpId: string) => boolean;
  onClusterSelect?: (timestampIso: string) => void;
  onPin: (topicId: string) => void;
  onArchive: (topicId: string) => void;
  onDelete: (topicId: string) => void;
  onEdit: (topicId: string, text: string, channel: Channel) => void;
  onAddFollowUp: (topicId: string, text: string, channel: Channel) => void;
  onEditFollowUp: (followUpId: string, text: string, channel: Channel) => void;
  onDeleteFollowUp: (followUpId: string) => void;
  onMoveToFolder: (topicId: string, folderId: string | null) => void;
  onReorderPinnedTopics: (draggedId: string, targetId: string) => void;
}) {
  const sensors = useAppDndSensors();
  const sortableIds = useMemo(() => topics.map((t) => topicSortId(t.id)), [topics]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (!isTopicSortId(activeId) || !isTopicSortId(overId) || activeId === overId) return;
    onReorderPinnedTopics(topicIdFromSortId(activeId), topicIdFromSortId(overId));
  }

  if (topics.length === 0) return null;

  return (
    <section className="pinned-strip">
      <h2 className="section-label mb-2 text-amber-800/80">Pinned topics</h2>
      <AppDndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-y-1">
          {topics.map((topic) => (
            <SortableTopicItem
              key={topic.id}
              topic={topic}
              folders={folders}
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
              onMoveToFolder={(folderId) => onMoveToFolder(topic.id, folderId)}
              pinnedStrip
            />
          ))}
          </div>
        </SortableContext>
      </AppDndContext>
    </section>
  );
}
