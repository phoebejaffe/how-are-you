import { formatExactTime, formatRelativeTime } from "../../lib/dates";

export function RelativeTime({ iso }: { iso: string }) {
  return (
    <span className="text-[10px] text-stone-400" title={formatExactTime(iso)}>
      {formatRelativeTime(iso)}
    </span>
  );
}
