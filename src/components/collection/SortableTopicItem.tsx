import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Channel, FollowUp, Topic, TopicFolder } from "../../types";
import { topicSortId, type TopicSortData } from "../dnd/dndIds";
import { TopicCollectionItem } from "./TopicCollectionItem";

export function SortableTopicItem({
  topic,
  folders = [],
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
  pinnedStrip = false,
}: {
  topic: Topic;
  folders?: TopicFolder[];
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
  onMoveToFolder?: (folderId: string | null) => void;
  pinnedStrip?: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
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
        folders={folders}
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
        onMoveToFolder={onMoveToFolder}
        pendingFollowUpDeletes={pendingFollowUpDeletes}
        sortableHandleRef={setActivatorNodeRef}
        sortableHandleProps={{ ...attributes, ...listeners }}
        pinnedStrip={pinnedStrip}
      />
    </div>
  );
}
