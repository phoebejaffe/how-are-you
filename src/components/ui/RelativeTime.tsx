import { formatRelativeTime } from "../../lib/dates";

export function RelativeTime({ iso }: { iso: string }) {
  return <span className="text-[10px] text-stone-400">{formatRelativeTime(iso)}</span>;
}
