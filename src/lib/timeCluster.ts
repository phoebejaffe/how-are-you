import type { PersonBundle } from "../types";

export const TIME_CLUSTER_WINDOW_MS = 2 * 60 * 60 * 1000;

export interface TimeCluster {
  topicIds: Set<string>;
  followUpIds: Set<string>;
}

export function isWithinTimeCluster(anchorIso: string, iso: string): boolean {
  const anchor = new Date(anchorIso).getTime();
  const time = new Date(iso).getTime();
  return Math.abs(time - anchor) <= TIME_CLUSTER_WINDOW_MS;
}

export function computeTimeCluster(
  bundle: PersonBundle,
  anchorIso: string,
  pendingTopicDeletes: Set<string>,
  pendingFollowUpDeletes: Set<string> = new Set(),
): TimeCluster {
  const topicIds = new Set<string>();
  const followUpIds = new Set<string>();

  for (const topic of bundle.topics) {
    if (pendingTopicDeletes.has(topic.id)) continue;
    if (isWithinTimeCluster(anchorIso, topic.createdAtIso)) {
      topicIds.add(topic.id);
    }
  }

  for (const followUp of bundle.followUps) {
    if (pendingFollowUpDeletes.has(followUp.id)) continue;
    if (isWithinTimeCluster(anchorIso, followUp.recordedAtIso)) {
      followUpIds.add(followUp.id);
    }
  }

  return { topicIds, followUpIds };
}
