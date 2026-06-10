import type { HTMLAttributes } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DRAG_SURFACE_ATTR } from "../dnd/dragClickGuard";
import { locationSummary } from "../../lib/personLocations";
import type { Person } from "../../types";
import { RelativeTime } from "../ui/RelativeTime";
import { RowMenu } from "../ui/RowMenu";

export function PersonListRow({
  person,
  onDelete,
  dragProps,
  className = "",
}: {
  person: Person;
  onDelete?: () => void;
  dragProps?: HTMLAttributes<HTMLElement>;
  className?: string;
}) {
  const navigate = useNavigate();
  const personPath = `/person/${encodeURIComponent(person.nameKey)}`;

  const menuItems = useMemo(
    () =>
      onDelete
        ? [{ label: "Delete", onClick: onDelete, destructive: true as const }]
        : [],
    [onDelete],
  );

  const hint = locationSummary(person);

  return (
    <div className={`flex items-center ${className}`}>
      <div
        {...dragProps}
        {...{ [DRAG_SURFACE_ATTR]: dragProps ? "" : undefined }}
        className={`min-w-0 flex-1 touch-none select-none ${dragProps?.className ?? ""} ${
          dragProps ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => navigate(personPath)}
          className="flex w-full flex-col gap-0.5 border-0 bg-transparent px-4 py-3.5 pr-3 text-left text-[0.9375rem] transition-colors active:bg-white/70"
        >
          <span className="flex min-w-0 items-baseline justify-between gap-3">
            <span className="min-w-0 break-words font-medium text-ink">{person.displayName}</span>
            {person.lastActivityAtIso && (
              <span className="shrink-0 text-xs text-ink-muted">
                <RelativeTime iso={person.lastActivityAtIso} />
              </span>
            )}
          </span>
          {hint && <span className="truncate text-xs text-ink-muted">{hint}</span>}
        </button>
      </div>
      {menuItems.length > 0 && (
        <div className="mr-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          <RowMenu items={menuItems} />
        </div>
      )}
    </div>
  );
}
