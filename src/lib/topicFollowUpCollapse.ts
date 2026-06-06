const STORAGE_KEY = "how-are-you-collapsed-topic-followups";

function loadCollapsed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveCollapsed(collapsed: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    if (collapsed.size === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsed]));
    }
  } catch {
    // quota / private mode
  }
}

export function isTopicFollowUpsCollapsed(topicId: string): boolean {
  return loadCollapsed().has(topicId);
}

export function setTopicFollowUpsCollapsed(topicId: string, collapsed: boolean): void {
  const next = loadCollapsed();
  if (collapsed) next.add(topicId);
  else next.delete(topicId);
  saveCollapsed(next);
}

export function toggleTopicFollowUpsCollapsed(topicId: string): boolean {
  const collapsed = !isTopicFollowUpsCollapsed(topicId);
  setTopicFollowUpsCollapsed(topicId, collapsed);
  return collapsed;
}
