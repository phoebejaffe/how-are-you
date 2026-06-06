import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Channel, FollowUp, Topic } from "../../types";
import { topicSortId, type TopicSortData } from "../dnd/dndIds";
import { TopicCollectionItem } from "./TopicCollectionItem";

export function SortableTopicItem({
  topic,
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
}: {
  topic: Topic;
  followUps: FollowUp[];
  pendingFollowUpDeletes: Set<string>;
  topicHighlighted?: boolean;
  followUpHighlighted?: (followUpId: string) => boolean;
  onClusterSelect?: (timestampIso: string) => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onEdit: (text: string, channel: Channel) => void;
  onAddFollowUp: (text: string, channel: Channel) => void;
  onEditFollowUp: (followUpId: string, text: string, channel: Channel) => void;
  onDeleteFollowUp: (followUpId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: topicSortId(topic.id),
    data: { type: "topic-sort", topicId: topic.id } satisfies TopicSortData,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-10 opacity-40" : ""}>
      <TopicCollectionItem
        topic={topic}
        followUps={followUps}
        topicHighlighted={topicHighlighted}
        followUpHighlighted={followUpHighlighted}
        onClusterSelect={onClusterSelect}
        onPin={onPin}
        onArchive={onArchive}
        onDelete={onDelete}
        onEdit={onEdit}
        onAddFollowUp={onAddFollowUp}
        onEditFollowUp={onEditFollowUp}
        onDeleteFollowUp={onDeleteFollowUp}
        pendingFollowUpDeletes={pendingFollowUpDeletes}
        sortableHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
