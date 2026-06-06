import type { HTMLAttributes } from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { Person } from "../../types";
import { RelativeTime } from "../ui/RelativeTime";
import { RowMenu } from "../ui/RowMenu";

export function PersonListRow({
  person,
  sortableHandleProps,
  onDelete,
}: {
  person: Person;
  sortableHandleProps?: HTMLAttributes<HTMLElement>;
  onDelete?: () => void;
}) {
  const menuItems = useMemo(
    () =>
      onDelete
        ? [{ label: "Delete", onClick: onDelete, destructive: true as const }]
        : [],
    [onDelete],
  );

  const row = (
    <>
      <Link
        to={`/person/${encodeURIComponent(person.nameKey)}`}
        className="flex min-w-0 flex-1 items-baseline justify-between gap-3 px-4 py-3.5 text-[0.9375rem] transition-colors active:bg-white/70"
        draggable={false}
      >
        <span className="min-w-0 break-words font-medium text-ink">{person.displayName}</span>
        {person.lastActivityAtIso && (
          <span className="shrink-0 text-xs text-ink-muted">
            <RelativeTime iso={person.lastActivityAtIso} />
          </span>
        )}
      </Link>
      {menuItems.length > 0 && (
        <div className="mr-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          <RowMenu items={menuItems} />
        </div>
      )}
    </>
  );

  if (sortableHandleProps) {
    return (
      <div className="flex touch-none select-none items-center" {...sortableHandleProps}>
        {row}
      </div>
    );
  }

  return <div className="flex items-center">{row}</div>;
}
