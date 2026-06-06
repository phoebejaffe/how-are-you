export type Channel = "call" | "text" | "in_person";

export type TopicStatus = "active" | "archived";

export interface Person {
  nameKey: string;
  displayName: string;
  createdAtIso: string;
  updatedAtIso: string;
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
}

export interface PersonBundle {
  person: Person;
  topics: Topic[];
  followUps: FollowUp[];
  facts: Fact[];
}

export interface ExportPayload {
  schemaVersion: 1;
  exportedAtIso: string;
  people: PersonBundle[];
}

export type ImportConflictResolution = "ignore" | "merge" | "override";

export interface ImportConflict {
  imported: PersonBundle;
  existing: PersonBundle;
  resolution?: ImportConflictResolution;
}
