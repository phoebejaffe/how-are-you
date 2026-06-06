const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((then - now) / 1000);
  const absSec = Math.abs(diffSec);

  if (absSec < 60) return "just now";
  if (absSec < 3600) return relativeFormatter.format(Math.round(diffSec / 60), "minute");
  if (absSec < 86400) return relativeFormatter.format(Math.round(diffSec / 3600), "hour");
  if (absSec < 604800) return relativeFormatter.format(Math.round(diffSec / 86400), "day");
  if (absSec < 2629800) return relativeFormatter.format(Math.round(diffSec / 604800), "week");
  if (absSec < 31557600) return relativeFormatter.format(Math.round(diffSec / 2629800), "month");
  return relativeFormatter.format(Math.round(diffSec / 31557600), "year");
}

export function formatShortDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
