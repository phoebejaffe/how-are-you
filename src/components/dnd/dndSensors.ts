import { MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

/** Mouse: start drag after a small move so clicks still work. Touch: short hold. */
export function useAppDndSensors() {
  return useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 6 },
    }),
  );
}
