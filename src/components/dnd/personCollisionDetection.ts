import { closestCenter, type CollisionDetection } from "@dnd-kit/core";
import { isPersonDragId } from "./dndIds";

/** When hovering another person, target them for reorder; otherwise use default folder/person hits. */
export const personCollisionDetection: CollisionDetection = (args) => {
  const collisions = closestCenter(args);
  const activeId = String(args.active.id);

  if (!isPersonDragId(activeId)) return collisions;

  const closest = collisions[0];
  if (
    closest &&
    isPersonDragId(String(closest.id)) &&
    closest.id !== args.active.id
  ) {
    return collisions.filter(
      (collision) =>
        isPersonDragId(String(collision.id)) && collision.id !== args.active.id,
    );
  }

  return collisions;
};
