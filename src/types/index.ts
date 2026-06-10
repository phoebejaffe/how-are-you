export type Channel = "call" | "text" | "in_person";

export type TopicStatus = "active" | "archived";

export type ActivityType = "topic" | "follow_up" | "fact";

export interface PersonLocation {
  id: string;
  label: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface ImportantDate {
  id: string;
  label: string;
  month: number;
  day: number;
  year?: number;
}

export interface Person {
  nameKey: string;
  displayName: string;
  createdAtIso: string;
  updatedAtIso: string;
  folderId?: string;
  sortOrder?: number;
  /** @deprecated Migrated to `locations` on read. */
  metLocation?: string;
  /** @deprecated Migrated to `locations` on read. */
  workLocation?: string;
  locations?: PersonLocation[];
  importantDates?: ImportantDate[];
  lastActivityAtIso?: string;
  lastActivityType?: ActivityType;
}

export interface PeopleFolder {
  id: string;
  name: string;
  collapsed: boolean;
  sortOrder: number;
}

export interface Topic {
  id: string;
  personNameKey: string;
  text: string;
  status: TopicStatus;
  pinned: boolean;
  sortOrder: number;
  folderId?: string;
  createdAtIso: string;
  channel: Channel;
}

export interface TopicFolder {
  id: string;
  personNameKey: string;
  name: string;
  collapsed: boolean;
  sortOrder: number;
}

export interface FollowUp {
  id: string;
  topicId: string;
  text: string;
  recordedAtIso: string;
  channel: Channel;
}

export interface Fact {
  id: string;
  personNameKey: string;
  text: string;
  pinned: boolean;
  sortOrder?: number;
  recordedAtIso: string;
  channel: Channel;
  folderId?: string;
}

export interface FactFolder {
  id: string;
  personNameKey: string;
  name: string;
  collapsed: boolean;
  sortOrder: number;
}

export interface PersonBundle {
  person: Person;
  topics: Topic[];
  followUps: FollowUp[];
  facts: Fact[];
  factFolders: FactFolder[];
  topicFolders: TopicFolder[];
}

export interface ExportPayload {
  schemaVersion: 1;
  exportedAtIso: string;
  people: PersonBundle[];
  peopleFolders?: PeopleFolder[];
}

export type ImportConflictResolution = "ignore" | "merge" | "override";

export interface ImportConflict {
  imported: PersonBundle;
  existing: PersonBundle;
  resolution?: ImportConflictResolution;
}
