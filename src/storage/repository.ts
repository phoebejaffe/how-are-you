import { computeLastActivityFromData, withLastActivity } from "../lib/lastActivity";
import { withTopicSortOrders } from "../lib/topicOrder";
import type { Fact, FactFolder, FollowUp, PeopleFolder, Person, PersonBundle, Topic } from "../types";
import { getDb } from "./db";

async function enrichPersonActivity(person: Person): Promise<Person> {
  if (person.lastActivityAtIso && person.lastActivityType) return person;

  const db = await getDb();
  const topics = await db.getAllFromIndex("topics", "by-person", person.nameKey);
  const facts = await db.getAllFromIndex("facts", "by-person", person.nameKey);
  const followUps: FollowUp[] = [];
  for (const topic of topics) {
    followUps.push(...(await db.getAllFromIndex("followUps", "by-topic", topic.id)));
  }

  const activity = computeLastActivityFromData({ topics, followUps, facts });
  if (!activity) return person;

  const enriched = withLastActivity(person, activity);
  await db.put("people", enriched);
  return enriched;
}

export async function listPeople(): Promise<Person[]> {
  const db = await getDb();
  const people = await db.getAll("people");
  const enriched = await Promise.all(people.map((person) => enrichPersonActivity(person)));
  return enriched.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function listPeopleFolders(): Promise<PeopleFolder[]> {
  const db = await getDb();
  const folders = await db.getAll("peopleFolders");
  return folders.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function savePeopleFolder(folder: PeopleFolder): Promise<void> {
  const db = await getDb();
  await db.put("peopleFolders", folder);
}

export async function deletePeopleFolderHard(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("peopleFolders", id);
}

export async function refreshPersonActivity(nameKey: string): Promise<Person | null> {
  const db = await getDb();
  const person = await db.get("people", nameKey);
  if (!person) return null;

  const topics = await db.getAllFromIndex("topics", "by-person", nameKey);
  const facts = await db.getAllFromIndex("facts", "by-person", nameKey);
  const followUps: FollowUp[] = [];
  for (const topic of topics) {
    followUps.push(...(await db.getAllFromIndex("followUps", "by-topic", topic.id)));
  }

  const activity = computeLastActivityFromData({ topics, followUps, facts });
  const updated: Person = activity
    ? withLastActivity(person, activity)
    : {
        ...person,
        lastActivityAtIso: undefined,
        lastActivityType: undefined,
      };

  await db.put("people", updated);
  return updated;
}

export async function getPersonBundle(nameKey: string): Promise<PersonBundle | null> {
  const db = await getDb();
  const person = await db.get("people", nameKey);
  if (!person) return null;

  const [topics, facts, factFolders] = await Promise.all([
    db.getAllFromIndex("topics", "by-person", nameKey),
    db.getAllFromIndex("facts", "by-person", nameKey),
    db.getAllFromIndex("factFolders", "by-person", nameKey),
  ]);

  const followUps: FollowUp[] = [];
  for (const topic of topics) {
    const topicFollowUps = await db.getAllFromIndex("followUps", "by-topic", topic.id);
    followUps.push(...topicFollowUps);
  }

  followUps.sort((a, b) => a.recordedAtIso.localeCompare(b.recordedAtIso));

  const normalizedTopics = withTopicSortOrders(topics);
  for (const topic of normalizedTopics) {
    const prev = topics.find((t) => t.id === topic.id);
    if (prev && prev.sortOrder !== topic.sortOrder) {
      await db.put("topics", topic);
    }
  }

  return { person, topics: normalizedTopics, followUps, facts, factFolders };
}

export async function listAllBundles(): Promise<PersonBundle[]> {
  const people = await listPeople();
  const bundles = await Promise.all(people.map((p) => getPersonBundle(p.nameKey)));
  return bundles.filter((b): b is PersonBundle => b !== null);
}

export async function savePerson(person: Person): Promise<void> {
  const db = await getDb();
  await db.put("people", person);
}

export async function saveTopic(topic: Topic): Promise<void> {
  const db = await getDb();
  await db.put("topics", topic);
}

export async function saveFollowUp(followUp: FollowUp): Promise<void> {
  const db = await getDb();
  await db.put("followUps", followUp);
}

export async function saveFact(fact: Fact): Promise<void> {
  const db = await getDb();
  await db.put("facts", fact);
}

export async function saveFactFolder(folder: FactFolder): Promise<void> {
  const db = await getDb();
  await db.put("factFolders", folder);
}

export async function deleteFactFolderHard(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("factFolders", id);
}

export async function deletePersonHard(nameKey: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["people", "topics", "followUps", "facts", "factFolders"], "readwrite");
  const topics = await tx.objectStore("topics").index("by-person").getAll(nameKey);
  for (const topic of topics) {
    const followUps = await tx.objectStore("followUps").index("by-topic").getAll(topic.id);
    for (const followUp of followUps) {
      await tx.objectStore("followUps").delete(followUp.id);
    }
    await tx.objectStore("topics").delete(topic.id);
  }
  const facts = await tx.objectStore("facts").index("by-person").getAll(nameKey);
  for (const fact of facts) {
    await tx.objectStore("facts").delete(fact.id);
  }
  const factFolders = await tx.objectStore("factFolders").index("by-person").getAll(nameKey);
  for (const folder of factFolders) {
    await tx.objectStore("factFolders").delete(folder.id);
  }
  await tx.objectStore("people").delete(nameKey);
  await tx.done;
}

export async function deleteTopicHard(topicId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["topics", "followUps"], "readwrite");
  const followUps = await tx.objectStore("followUps").index("by-topic").getAll(topicId);
  for (const followUp of followUps) {
    await tx.objectStore("followUps").delete(followUp.id);
  }
  await tx.objectStore("topics").delete(topicId);
  await tx.done;
}

export async function deleteFollowUpHard(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("followUps", id);
}

export async function deleteFactHard(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("facts", id);
}

export async function renamePerson(oldKey: string, newKey: string, displayName: string): Promise<void> {
  const db = await getDb();
  const existing = await db.get("people", oldKey);
  if (!existing) throw new Error("Person not found");

  const updatedPerson: Person = {
    ...existing,
    nameKey: newKey,
    displayName,
    updatedAtIso: new Date().toISOString(),
  };

  const tx = db.transaction(["people", "topics", "facts", "factFolders"], "readwrite");
  const topics = await tx.objectStore("topics").index("by-person").getAll(oldKey);
  const facts = await tx.objectStore("facts").index("by-person").getAll(oldKey);
  const factFolders = await tx.objectStore("factFolders").index("by-person").getAll(oldKey);

  await tx.objectStore("people").delete(oldKey);
  await tx.objectStore("people").put(updatedPerson);

  for (const topic of topics) {
    await tx.objectStore("topics").put({ ...topic, personNameKey: newKey });
  }
  for (const fact of facts) {
    await tx.objectStore("facts").put({ ...fact, personNameKey: newKey });
  }
  for (const folder of factFolders) {
    await tx.objectStore("factFolders").put({ ...folder, personNameKey: newKey });
  }

  await tx.done;
}

export async function savePersonBundle(bundle: PersonBundle): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["people", "topics", "followUps", "facts", "factFolders"], "readwrite");
  await tx.objectStore("people").put(bundle.person);
  for (const topic of bundle.topics) {
    await tx.objectStore("topics").put(topic);
  }
  for (const followUp of bundle.followUps) {
    await tx.objectStore("followUps").put(followUp);
  }
  for (const fact of bundle.facts) {
    await tx.objectStore("facts").put(fact);
  }
  for (const folder of bundle.factFolders ?? []) {
    await tx.objectStore("factFolders").put(folder);
  }
  await tx.done;
}

export async function replacePersonBundle(nameKey: string, bundle: PersonBundle): Promise<void> {
  await deletePersonHard(nameKey);
  await savePersonBundle(bundle);
}
