import { DragOverlay, useDndContext } from "@dnd-kit/core";
import type { ReactNode } from "react";

/** Drag preview that keeps the grab-point offset and matches the source row width. */
export function AppDragOverlay({ children }: { children?: ReactNode }) {
  const { active } = useDndContext();
  const width =
    active?.rect.current?.translated?.width ?? active?.rect.current?.initial?.width;

  return (
    <DragOverlay dropAnimation={null}>
      {active && children ? (
        <div
          className="pointer-events-none cursor-grabbing"
          style={{ width: width ? `${width}px` : undefined }}
        >
          {children}
        </div>
      ) : null}
    </DragOverlay>
  );
}
