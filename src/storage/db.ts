import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Fact, FactFolder, FollowUp, Person, Topic } from "../types";

export const DB_NAME = "how-are-you-v1";
export const DB_VERSION = 2;

interface HowAreYouDB extends DBSchema {
  people: {
    key: string;
    value: Person;
  };
  topics: {
    key: string;
    value: Topic;
    indexes: { "by-person": string };
  };
  followUps: {
    key: string;
    value: FollowUp;
    indexes: { "by-topic": string };
  };
  facts: {
    key: string;
    value: Fact;
    indexes: { "by-person": string };
  };
  factFolders: {
    key: string;
    value: FactFolder;
    indexes: { "by-person": string };
  };
}

let dbPromise: Promise<IDBPDatabase<HowAreYouDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<HowAreYouDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HowAreYouDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("people")) {
          db.createObjectStore("people", { keyPath: "nameKey" });
        }
        if (!db.objectStoreNames.contains("topics")) {
          const store = db.createObjectStore("topics", { keyPath: "id" });
          store.createIndex("by-person", "personNameKey");
        }
        if (!db.objectStoreNames.contains("followUps")) {
          const store = db.createObjectStore("followUps", { keyPath: "id" });
          store.createIndex("by-topic", "topicId");
        }
        if (!db.objectStoreNames.contains("facts")) {
          const store = db.createObjectStore("facts", { keyPath: "id" });
          store.createIndex("by-person", "personNameKey");
        }
        if (!db.objectStoreNames.contains("factFolders")) {
          const store = db.createObjectStore("factFolders", { keyPath: "id" });
          store.createIndex("by-person", "personNameKey");
        }
      },
    });
  }
  return dbPromise;
}
