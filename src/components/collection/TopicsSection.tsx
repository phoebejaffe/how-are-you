import { useState } from "react";
import type { Channel, FollowUp, Topic, TopicFolder } from "../../types";
import { sortArchivedTopics } from "../../lib/topicOrder";
import { topicsLayoutStorageKey } from "../../lib/topicFolders";
import { isTopicSortId, topicSortId } from "../dnd/dndIds";
import { RowMenu } from "../ui/RowMenu";
import { SectionAddLink } from "../ui/SectionAddLink";
import { CollectionSection } from "./CollectionSection";
import { SortableTopicItem } from "./SortableTopicItem";
import { TopicCollectionItem } from "./TopicCollectionItem";

export function TopicsSection({
  personKey,
  folders,
  unpinnedTopics,
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
  onMoveToFolder,
  onReorderTopics,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolderCollapsed,
  onReorderLayout,
}: {
  personKey: string;
  folders: TopicFolder[];
  unpinnedTopics: Topic[];
  followUps: FollowUp[];
  pendingFollowUpDeletes: Set<string>;
  archivedTopics: Topic[];
  topicHighlighted?: (topicId: string) => boolean;
  followUpHighlighted?: (followUpId: string) => boolean;
  onClusterSelect?: (timestampIso: string) => void;
  onAddTopic: (text: string, channel: Channel, folderId?: string) => void;
  onPin: (topicId: string) => void;
  onArchive: (topicId: string) => void;
  onUnarchive: (topicId: string) => void;
  onDelete: (topicId: string) => void;
  onEdit: (topicId: string, text: string, channel: Channel) => void;
  onAddFollowUp: (topicId: string, text: string, channel: Channel) => void;
  onEditFollowUp: (followUpId: string, text: string, channel: Channel) => void;
  onDeleteFollowUp: (followUpId: string) => void;
  onMoveToFolder: (topicId: string, folderId: string | null) => void;
  onReorderTopics: (draggedId: string, targetId: string) => void;
  onAddFolder: (name: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolderCollapsed: (folderId: string) => void;
  onReorderLayout: (draggedId: string, targetId: string) => void;
}) {
  const [topicText, setTopicText] = useState("");
  const [targetFolderId, setTargetFolderId] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const hasFolders = folders.length > 0;
  const sortedArchived = sortArchivedTopics(archivedTopics);
  const hasArchived = sortedArchived.length > 0;

  function renderTopicItem(topic: Topic, archived: boolean) {
    return (
      <TopicCollectionItem
        topic={topic}
        folders={folders}
        followUps={followUps}
        archived={archived}
        topicHighlighted={topicHighlighted?.(topic.id)}
        followUpHighlighted={followUpHighlighted}
        onClusterSelect={onClusterSelect}
        onPin={() => onPin(topic.id)}
        onArchive={() => onArchive(topic.id)}
        onUnarchive={archived ? () => onUnarchive(topic.id) : undefined}
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
    <CollectionSection
      title="Topics"
      addLinkLabel="add a topic"
      emptyMessage="No active topics."
      layoutStorageKey={topicsLayoutStorageKey(personKey)}
      items={unpinnedTopics}
      folders={folders}
      archivedItems={sortedArchived}
      showArchivedItems={showArchived}
      headerMenu={
        hasArchived && !showArchived ? (
          <RowMenu compact items={[{ label: "Show archived", onClick: () => setShowArchived(true) }]} />
        ) : undefined
      }
      headerBanner={
        showArchived ? (
          <div className="mb-1 px-1">
            <SectionAddLink onClick={() => setShowArchived(false)} hidePrefix>
              hide archived items
            </SectionAddLink>
          </div>
        ) : undefined
      }
      features={{
        folders: true,
        folderCreate: true,
        dragItems: true,
        dragFolders: true,
        addFolderPicker: true,
      }}
      isItemDragId={isTopicSortId}
      itemIdFromDragId={(dragId) => dragId.slice("topic-sort:".length)}
      getItemDragId={(topic) => topicSortId(topic.id)}
      onAddFolder={onAddFolder}
      onRenameFolder={onRenameFolder}
      onDeleteFolder={onDeleteFolder}
      onToggleFolderCollapsed={onToggleFolderCollapsed}
      onMoveItemToFolder={(topicId, folderId) => onMoveToFolder(topicId, folderId)}
      onReorderItems={onReorderTopics}
      onReorderFolders={onReorderLayout}
      addForm={({ onDone }) => (
        <AddTopicForm
          topicText={topicText}
          targetFolderId={targetFolderId}
          folders={folders}
          hasFolders={hasFolders}
          onTextChange={setTopicText}
          onFolderChange={setTargetFolderId}
          onSubmit={() => {
            onAddTopic(topicText, "text", targetFolderId || undefined);
            setTopicText("");
            setTargetFolderId("");
            onDone();
          }}
          onCancel={() => {
            setTopicText("");
            setTargetFolderId("");
            onDone();
          }}
        />
      )}
      renderItem={(topic, { sortable, archived }) =>
        sortable && !archived ? (
          <SortableTopicItem
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
          />
        ) : (
          renderTopicItem(topic, Boolean(archived))
        )
      }
    />
  );
}

function AddTopicForm({
  topicText,
  targetFolderId,
  folders,
  hasFolders,
  onTextChange,
  onFolderChange,
  onSubmit,
  onCancel,
}: {
  topicText: string;
  targetFolderId: string;
  folders: TopicFolder[];
  hasFolders: boolean;
  onTextChange: (value: string) => void;
  onFolderChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="my-2 flex flex-wrap items-center gap-2 px-1"
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
        placeholder="Add a topic…"
        className="input input-compact min-w-0 flex-1"
        autoFocus
      />
      {hasFolders && (
        <select
          value={targetFolderId}
          onChange={(e) => onFolderChange(e.target.value)}
          className="input input-compact w-auto text-ink-muted"
          aria-label="Folder"
        >
          <option value="">Unsorted</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      )}
      <button type="submit" className="btn-primary btn-compact">
        Add
      </button>
      <button type="button" onClick={onCancel} aria-label="Cancel" className="btn-ghost btn-compact min-w-11 px-3">
        ✕
      </button>
    </form>
  );
}
