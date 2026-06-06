import { formatRelativeTime } from "../../lib/dates";

export function RelativeTime({ iso }: { iso: string }) {
  return <span className="text-xs text-ink-muted">{formatRelativeTime(iso)}</span>;
}
