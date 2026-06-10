import type { HTMLAttributes } from "react";
import type { Channel, Fact, FactFolder } from "../../types";
import { factDragId } from "../dnd/dndIds";
import { CollectionItemRow } from "./CollectionItemRow";
import { FACT_ITEM_FEATURES } from "./itemFeatures";
import type { CollectionFolderRef } from "./types";

export function FactCollectionItem({
  fact,
  folders = [],
  draggable = false,
  onPin,
  onDelete,
  onEdit,
  onMoveToFolder,
  sortableHandleRef,
  sortableHandleProps,
}: {
  fact: Fact;
  folders?: FactFolder[];
  draggable?: boolean;
  onPin: () => void;
  onDelete: () => void;
  onEdit: (text: string, channel: Channel) => void;
  onMoveToFolder?: (folderId: string | null) => void;
  sortableHandleRef?: (node: HTMLButtonElement | null) => void;
  sortableHandleProps?: HTMLAttributes<HTMLButtonElement>;
}) {
  const folderRefs: CollectionFolderRef[] = folders.map((f) => ({ id: f.id, name: f.name }));

  return (
    <CollectionItemRow
      text={fact.text}
      timestampIso={fact.recordedAtIso}
      channel={fact.channel}
      pinned={fact.pinned}
      features={{
        ...FACT_ITEM_FEATURES,
        draggable: draggable && !sortableHandleProps,
        moveToFolder: Boolean(onMoveToFolder && folders.length > 0),
      }}
      menuActions={{
        onEdit: () => {},
        onPin,
        onMoveToFolder,
        onDelete,
      }}
      folders={folderRefs}
      currentFolderId={fact.folderId ?? null}
      editChannel={fact.channel}
      onSaveEdit={onEdit}
      deleteTitle="Delete fact?"
      deleteMessage="This fact will be permanently removed."
      dragId={draggable && !sortableHandleProps ? factDragId(fact.id) : undefined}
      sortableHandleRef={sortableHandleRef}
      sortableHandleProps={sortableHandleProps}
    />
  );
}
