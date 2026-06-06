import type { Fact, FollowUp, Person, PersonBundle, Topic } from "../types";
import { getDb } from "./db";

export async function listPeople(): Promise<Person[]> {
  const db = await getDb();
  const people = await db.getAll("people");
  return people.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function getPersonBundle(nameKey: string): Promise<PersonBundle | null> {
  const db = await getDb();
  const person = await db.get("people", nameKey);
  if (!person) return null;

  const [topics, facts] = await Promise.all([
    db.getAllFromIndex("topics", "by-person", nameKey),
    db.getAllFromIndex("facts", "by-person", nameKey),
  ]);

  const followUps: FollowUp[] = [];
  for (const topic of topics) {
    const topicFollowUps = await db.getAllFromIndex("followUps", "by-topic", topic.id);
    followUps.push(...topicFollowUps);
  }

  followUps.sort((a, b) => b.recordedAtIso.localeCompare(a.recordedAtIso));

  return { person, topics, followUps, facts };
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

export async function deletePersonHard(nameKey: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["people", "topics", "followUps", "facts"], "readwrite");
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

  const tx = db.transaction(["people", "topics", "facts"], "readwrite");
  const topics = await tx.objectStore("topics").index("by-person").getAll(oldKey);
  const facts = await tx.objectStore("facts").index("by-person").getAll(oldKey);

  await tx.objectStore("people").delete(oldKey);
  await tx.objectStore("people").put(updatedPerson);

  for (const topic of topics) {
    await tx.objectStore("topics").put({ ...topic, personNameKey: newKey });
  }
  for (const fact of facts) {
    await tx.objectStore("facts").put({ ...fact, personNameKey: newKey });
  }

  await tx.done;
}

export async function savePersonBundle(bundle: PersonBundle): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["people", "topics", "followUps", "facts"], "readwrite");
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
  await tx.done;
}

export async function replacePersonBundle(nameKey: string, bundle: PersonBundle): Promise<void> {
  await deletePersonHard(nameKey);
  await savePersonBundle(bundle);
}
