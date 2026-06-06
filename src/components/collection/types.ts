import type { Channel } from "../../types";

/** Feature flags for a single collection item row. */
export interface CollectionItemFeatures {
  copy?: boolean;
  edit?: boolean;
  pin?: boolean;
  archive?: boolean;
  unarchive?: boolean;
  moveToFolder?: boolean;
  delete?: boolean;
  showChannel?: boolean;
  showTimestamp?: boolean;
  timeCluster?: boolean;
  draggable?: boolean;
  collapsible?: boolean;
}

/** Feature flags for a collection section (topics, facts, etc.). */
export interface CollectionSectionFeatures {
  folders?: boolean;
  folderCreate?: boolean;
  dragItems?: boolean;
  dragFolders?: boolean;
  addChannelPicker?: boolean;
  addFolderPicker?: boolean;
  pinnedStrip?: boolean;
  archivedSection?: boolean;
}

export interface CollectionFolderRef {
  id: string;
  name: string;
}

export interface CollectionItemMenuActions {
  onEdit: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onMoveToFolder?: (folderId: string | null) => void;
  onDelete: () => void;
}

export interface CollectionItemMenuConfig {
  text: string;
  pinned?: boolean;
  archived?: boolean;
  currentFolderId?: string | null;
  folders?: CollectionFolderRef[];
  features: CollectionItemFeatures;
  actions: CollectionItemMenuActions;
}

export interface CollectionItemEditConfig {
  text: string;
  channel: Channel;
  showChannel?: boolean;
  compact?: boolean;
  onSave: (text: string, channel: Channel) => void;
}
