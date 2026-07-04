import { DndContext, type DndContextProps } from "@dnd-kit/core";
import { useDragClickGuard } from "./dragClickGuard";

export function AppDndContext({
  children,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
  autoScroll = true,
  ...rest
}: DndContextProps) {
  const guard = useDragClickGuard();

  return (
    <DndContext
      {...rest}
      autoScroll={autoScroll}
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
