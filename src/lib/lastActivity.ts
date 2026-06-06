import type { ActivityType, Fact, FollowUp, Person, Topic } from "../types";

export function activityTypeLabel(type: ActivityType): string {
  switch (type) {
    case "topic":
      return "topic";
    case "follow_up":
      return "follow-up";
    case "fact":
      return "fact";
  }
}

export function computeLastActivityFromData({
  topics,
  followUps,
  facts,
}: {
  topics: Topic[];
  followUps: FollowUp[];
  facts: Fact[];
}): { at: string; type: ActivityType } | null {
  let best: { at: string; type: ActivityType } | null = null;

  for (const topic of topics) {
    if (!best || topic.createdAtIso > best.at) {
      best = { at: topic.createdAtIso, type: "topic" };
    }
  }
  for (const followUp of followUps) {
    if (!best || followUp.recordedAtIso > best.at) {
      best = { at: followUp.recordedAtIso, type: "follow_up" };
    }
  }
  for (const fact of facts) {
    if (!best || fact.recordedAtIso > best.at) {
      best = { at: fact.recordedAtIso, type: "fact" };
    }
  }

  return best;
}

export function withLastActivity(
  person: Person,
  activity: { at: string; type: ActivityType },
): Person {
  return {
    ...person,
    lastActivityAtIso: activity.at,
    lastActivityType: activity.type,
  };
}

export function bumpLastActivity(person: Person, at: string, type: ActivityType): Person {
  if (person.lastActivityAtIso && person.lastActivityAtIso >= at) {
    return person;
  }
  return withLastActivity(person, { at, type });
}
