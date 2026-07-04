import type { HTMLAttributes } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DragHandle } from "../dnd/DragHandle";
import { personListSubtitles } from "../../lib/personContext";
import type { Person } from "../../types";
import { RelativeTime } from "../ui/RelativeTime";
import { RowMenu } from "../ui/RowMenu";

export function PersonListRow({
  person,
  onDelete,
  dragHandleRef,
  dragHandleProps,
  trailingSpacer = false,
  className = "",
}: {
  person: Person;
  onDelete?: () => void;
  dragHandleRef?: (node: HTMLButtonElement | null) => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  /** Match source row width when rendered in DragOverlay (menu column absent). */
  trailingSpacer?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();
  const personPath = `/person/${encodeURIComponent(person.nameKey)}`;
  const subtitles = personListSubtitles(person);

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
          className="flex w-full flex-col gap-0.5 border-0 bg-transparent px-2.5 py-2 pr-2.5 text-left text-[0.9375rem] transition-colors active:bg-white/70"
        >
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-medium text-ink">{person.displayName}</span>
            {person.lastActivityAtIso && <RelativeTime iso={person.lastActivityAtIso} />}
          </span>
          {subtitles.map((line) => (
            <span key={line} className="truncate text-xs text-ink-muted">
              {line}
            </span>
          ))}
        </button>
      </div>
      {menuItems.length > 0 && (
        <div className="mr-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          <RowMenu items={menuItems} />
        </div>
      )}
      {trailingSpacer && <div className="mr-1 size-11 shrink-0" aria-hidden />}
    </div>
  );
}
