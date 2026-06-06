import type { CollectionItemFeatures } from "./types";

/** Topics: channel, pin, archive, folders, collapsible follow-ups, time clustering. */
export const TOPIC_ITEM_FEATURES: CollectionItemFeatures = {
  copy: true,
  edit: true,
  pin: true,
  archive: true,
  unarchive: true,
  moveToFolder: true,
  delete: true,
  showChannel: false,
  showTimestamp: true,
  timeCluster: true,
  collapsible: true,
};

/** Facts: folders, drag, pin — no channel in row UI. */
export const FACT_ITEM_FEATURES: CollectionItemFeatures = {
  copy: true,
  edit: true,
  pin: true,
  moveToFolder: true,
  delete: true,
  showChannel: false,
  showTimestamp: true,
};

/** Follow-ups: channel, copy, edit, delete. */
export const FOLLOW_UP_ITEM_FEATURES: CollectionItemFeatures = {
  copy: true,
  edit: true,
  delete: true,
  showChannel: false,
  showTimestamp: true,
  timeCluster: true,
};
