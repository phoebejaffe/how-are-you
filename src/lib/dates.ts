const WEEKDAY_SHORT = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"] as const;
const ONE_HOUR_MS = 3_600_000;

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatMdYy(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear() % 100;
  return `${m}/${d}/${y.toString().padStart(2, "0")}`;
}

export function formatExactTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const elapsedMs = now.getTime() - then.getTime();

  if (elapsedMs >= 0 && elapsedMs < ONE_HOUR_MS) return "now";

  const dayDiff = Math.round((startOfLocalDay(now) - startOfLocalDay(then)) / 86_400_000);

  if (dayDiff === 0) return "today";
  if (dayDiff === 1) return "yesterday";
  if (dayDiff > 1 && dayDiff < 7) return WEEKDAY_SHORT[then.getDay()];

  return formatMdYy(then);
}

export function formatShortDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
