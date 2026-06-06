import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { personDragId, type PersonDragData } from "../dnd/dndIds";
import { activityTypeLabel } from "../../lib/lastActivity";
import type { Person } from "../../types";
import { RelativeTime } from "../ui/RelativeTime";
import { RowMenu } from "../ui/RowMenu";

function sortPeopleForDisplay(people: Person[]): Person[] {
  return [...people].sort((a, b) => {
    const aTime = a.lastActivityAtIso ?? "";
    const bTime = b.lastActivityAtIso ?? "";
    if (aTime !== bTime) return bTime.localeCompare(aTime);
    return a.displayName.localeCompare(b.displayName);
  });
}

export function sortPeople(people: Person[]): Person[] {
  return sortPeopleForDisplay(people);
}

export function PersonListRow({
  person,
  draggable = false,
  onDelete,
}: {
  person: Person;
  draggable?: boolean;
  onDelete?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: personDragId(person.nameKey),
    data: { type: "person", nameKey: person.nameKey } satisfies PersonDragData,
    disabled: !draggable,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const menuItems = useMemo(
    () =>
      onDelete
        ? [{ label: "Delete", onClick: onDelete, destructive: true as const }]
        : [],
    [onDelete],
  );

  const activityLabel =
    person.lastActivityAtIso && person.lastActivityType
      ? `${activityTypeLabel(person.lastActivityType)} · `
      : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex touch-none select-none items-center ${isDragging ? "z-10 opacity-40" : ""}`}
    >
      <div
        className="flex min-w-0 flex-1 items-center"
        {...(draggable ? listeners : {})}
        {...(draggable ? attributes : {})}
      >
        <Link
          to={`/person/${encodeURIComponent(person.nameKey)}`}
          className="flex min-w-0 flex-1 items-baseline justify-between gap-3 px-3 py-2.5 text-sm active:bg-white/60"
          draggable={false}
        >
          <span className="min-w-0 break-words font-medium text-stone-800">{person.displayName}</span>
          {person.lastActivityAtIso && (
            <span className="shrink-0 text-xs text-stone-400">
              {activityLabel}
              <RelativeTime iso={person.lastActivityAtIso} />
            </span>
          )}
        </Link>
      </div>
      {menuItems.length > 0 && (
        <div className="mr-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          <RowMenu items={menuItems} />
        </div>
      )}
    </div>
  );
}
