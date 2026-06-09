import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import { useCallback, useRef } from "react";

export const DRAG_CLICK_THRESHOLD_PX = 20;

export const DRAG_SURFACE_ATTR = "data-drag-surface";

let activeDragSurface: HTMLElement | null = null;

function findDragSurface(event: DragStartEvent): HTMLElement | null {
  const target = event.activatorEvent.target;
  if (!(target instanceof Element)) return null;
  return target.closest(`[${DRAG_SURFACE_ATTR}]`) as HTMLElement | null;
}

function armClickSuppression(surface: HTMLElement) {
  const block = (event: Event) => {
    const target = event.target;
    if (target instanceof Node && surface.contains(target)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  window.addEventListener("click", block, { capture: true, once: true });
}

export function useDragClickGuard() {
  const exceededRef = useRef(false);

  const onDragStart = useCallback((event: DragStartEvent) => {
    exceededRef.current = false;
    activeDragSurface = findDragSurface(event);
  }, []);

  const onDragMove = useCallback((event: DragMoveEvent) => {
    if (Math.hypot(event.delta.x, event.delta.y) >= DRAG_CLICK_THRESHOLD_PX) {
      exceededRef.current = true;
    }
  }, []);

  const onDragEnd = useCallback((_event: DragEndEvent) => {
    const surface = activeDragSurface;
    activeDragSurface = null;
    if (exceededRef.current && surface) {
      armClickSuppression(surface);
    }
    exceededRef.current = false;
  }, []);

  const onDragCancel = useCallback(() => {
    activeDragSurface = null;
    exceededRef.current = false;
  }, []);

  return { onDragStart, onDragMove, onDragEnd, onDragCancel };
}
