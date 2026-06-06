export type Channel = "call" | "text" | "in_person";

export type TopicStatus = "active" | "archived";

export type ActivityType = "topic" | "follow_up" | "fact";

export interface Person {
  nameKey: string;
  displayName: string;
  createdAtIso: string;
  updatedAtIso: string;
  folderId?: string;
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
  createdAtIso: string;
  channel: Channel;
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
