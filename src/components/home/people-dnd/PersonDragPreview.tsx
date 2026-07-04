import { createPortal } from "react-dom";
import type { Person } from "../../../types";
import { PersonListRow } from "../PersonListRow";

export type DragPreviewPosition = { x: number; y: number; width: number };

export function PersonDragPreview({
  person,
  position,
}: {
  person: Person;
  position: DragPreviewPosition;
}) {
  return createPortal(
    <div
      className="pointer-events-none fixed z-[100] rounded-lg bg-white/95 shadow-lift ring-1 ring-stone-200/70"
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        boxSizing: "border-box",
      }}
    >
      <PersonListRow person={person} trailingSpacer />
    </div>,
    document.body,
  );
}
