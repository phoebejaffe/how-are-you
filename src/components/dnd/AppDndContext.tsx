import { DndContext, type DndContextProps } from "@dnd-kit/core";
import { useDragClickGuard } from "./dragClickGuard";

export function AppDndContext({
  children,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
  ...rest
}: DndContextProps) {
  const guard = useDragClickGuard();

  return (
    <DndContext
      {...rest}
      onDragStart={(event) => {
        guard.onDragStart(event);
        onDragStart?.(event);
      }}
      onDragMove={(event) => {
        guard.onDragMove(event);
        onDragMove?.(event);
      }}
      onDragEnd={(event) => {
        onDragEnd?.(event);
        guard.onDragEnd(event);
      }}
      onDragCancel={(event) => {
        onDragCancel?.(event);
        guard.onDragCancel();
      }}
    >
      {children}
    </DndContext>
  );
}
