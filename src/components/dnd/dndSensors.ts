import { MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { DRAG_CLICK_THRESHOLD_PX } from "./dragClickGuard";

/** Mouse: start drag after threshold px so taps still navigate. Touch: short hold. */
export function useAppDndSensors() {
  return useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: DRAG_CLICK_THRESHOLD_PX },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: DRAG_CLICK_THRESHOLD_PX },
    }),
  );
}
