import { copyMenuItem } from "../../lib/clipboard";
import type { RowMenuItem } from "../ui/RowMenu";
import type { CollectionItemMenuConfig } from "./types";

const DEFAULT_FEATURES = {
  copy: true,
  edit: true,
  delete: true,
} as const;

export function buildCollectionItemMenu(config: CollectionItemMenuConfig): RowMenuItem[] {
  const { text, pinned, archived, currentFolderId, folders, features, actions } = config;
  const f = { ...DEFAULT_FEATURES, ...features };
  const items: RowMenuItem[] = [];

  if (f.copy) items.push(copyMenuItem(text));
  if (f.edit) items.push({ label: "Edit", onClick: actions.onEdit });

  if (archived && f.unarchive && actions.onUnarchive) {
    items.push({ label: "Unarchive", onClick: actions.onUnarchive });
  } else {
    if (f.pin && actions.onPin) {
      items.push({ label: pinned ? "Unpin" : "Pin", onClick: actions.onPin });
    }
    if (f.archive && actions.onArchive) {
      items.push({ label: "Archive", onClick: actions.onArchive });
    }
  }

  if (f.moveToFolder && actions.onMoveToFolder && folders && folders.length > 0) {
    for (const folder of folders) {
      if (folder.id === currentFolderId) continue;
      items.push({
        label: `Move to ${folder.name}`,
        onClick: () => actions.onMoveToFolder!(folder.id),
      });
    }
    if (currentFolderId) {
      items.push({
        label: "Move to Unsorted",
        onClick: () => actions.onMoveToFolder!(null),
      });
    }
  }

  if (f.delete) {
    items.push({ label: "Delete", onClick: actions.onDelete, destructive: true });
  }

  return items;
}
