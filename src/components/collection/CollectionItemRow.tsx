import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState, type HTMLAttributes } from "react";
import type { Channel } from "../../types";
import { DragHandle } from "../dnd/DragHandle";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EntryRow } from "../ui/EntryRow";
import { InlineEditor } from "../ui/InlineEditor";
import { buildCollectionItemMenu } from "./buildItemMenu";
import type { CollectionItemFeatures, CollectionItemMenuActions, CollectionFolderRef } from "./types";

export function CollectionItemRow({
  text,
  timestampIso,
  channel,
  pinned = false,
  archived = false,
  highlighted = false,
  compact = false,
  features,
  menuActions,
  folders,
  currentFolderId,
  editChannel,
  editCompact,
  onSaveEdit,
  deleteTitle,
  deleteMessage,
  dragId,
  disclosureCollapsed,
  disclosureCount,
  onRowClick,
  onClusterSelect,
  sortableHandleRef,
  sortableHandleProps,
}: {
  text: string;
  timestampIso: string;
  channel?: Channel;
  pinned?: boolean;
  archived?: boolean;
  highlighted?: boolean;
  compact?: boolean;
  features: CollectionItemFeatures;
  menuActions: CollectionItemMenuActions;
  folders?: CollectionFolderRef[];
  currentFolderId?: string | null;
  editChannel?: Channel;
  editCompact?: boolean;
  onSaveEdit: (text: string, channel: Channel) => void;
  deleteTitle: string;
  deleteMessage: string;
  dragId?: string;
  disclosureCollapsed?: boolean;
  disclosureCount?: number;
  onRowClick?: () => void;
  onClusterSelect?: (timestampIso: string) => void;
  sortableHandleRef?: (node: HTMLButtonElement | null) => void;
  sortableHandleProps?: HTMLAttributes<HTMLButtonElement>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const draggable = Boolean(features.draggable && dragId);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({
    id: dragId ?? "disabled",
    disabled: !draggable || editing,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const menuItems = useMemo(
    () =>
      buildCollectionItemMenu({
        text,
        pinned,
        archived,
        currentFolderId,
        folders,
        features,
        actions: {
          ...menuActions,
          onEdit: () => setEditing(true),
          onDelete: () => setConfirmDelete(true),
        },
      }),
    [text, pinned, archived, currentFolderId, folders, features, menuActions],
  );

  const confirmDialog = (
    <ConfirmDialog
      open={confirmDelete}
      title={deleteTitle}
      message={deleteMessage}
      onConfirm={() => {
        setConfirmDelete(false);
        menuActions.onDelete();
      }}
      onCancel={() => setConfirmDelete(false)}
    />
  );

  if (editing) {
    return (
      <div className={compact ? "py-0.5" : "py-2"}>
        <InlineEditor
          compact={editCompact ?? compact}
          text={text}
          channel={editChannel ?? channel ?? "text"}
          showChannel={features.showChannel ?? false}
          onSave={(savedText, savedChannel) => {
            onSaveEdit(savedText, savedChannel);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const handle =
    sortableHandleProps ? (
      <DragHandle ref={sortableHandleRef} compact {...sortableHandleProps} />
    ) : draggable ? (
      <DragHandle ref={setActivatorNodeRef} compact {...attributes} {...listeners} />
    ) : undefined;

  const row = (
    <EntryRow
      leading={handle}
      text={text}
      timestampIso={timestampIso}
      channel={features.showChannel ? channel : undefined}
      menuItems={menuItems}
      archived={archived}
      highlighted={highlighted}
      compact={compact}
      disclosureCollapsed={disclosureCollapsed}
      disclosureCount={disclosureCount}
      onRowClick={onRowClick}
      onClusterSelect={features.timeCluster ? onClusterSelect : undefined}
    />
  );

  if (draggable) {
    return (
      <>
        <div ref={setNodeRef} style={style} className={isDragging ? "z-10 opacity-40" : ""}>
          {row}
        </div>
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      {row}
      {confirmDialog}
    </>
  );
}
