import type { HTMLAttributes } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DragHandle } from "../dnd/DragHandle";
import { locationSummary } from "../../lib/personLocations";
import type { Person } from "../../types";
import { RelativeTime } from "../ui/RelativeTime";
import { RowMenu } from "../ui/RowMenu";

export function PersonListRow({
  person,
  onDelete,
  dragHandleRef,
  dragHandleProps,
  className = "",
}: {
  person: Person;
  onDelete?: () => void;
  dragHandleRef?: (node: HTMLButtonElement | null) => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  className?: string;
}) {
  const navigate = useNavigate();
  const personPath = `/person/${encodeURIComponent(person.nameKey)}`;
  const hint = locationSummary(person);

  const menuItems = useMemo(
    () =>
      onDelete
        ? [{ label: "Delete", onClick: onDelete, destructive: true as const }]
        : [],
    [onDelete],
  );

  return (
    <div className={`flex items-center ${className}`}>
      {dragHandleProps && (
        <DragHandle ref={dragHandleRef} className="ml-0.5" {...dragHandleProps} />
      )}
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => navigate(personPath)}
          className="flex w-full flex-col gap-0.5 border-0 bg-transparent px-3 py-3.5 pr-3 text-left text-[0.9375rem] transition-colors active:bg-white/70"
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
