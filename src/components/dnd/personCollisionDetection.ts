import { closestCenter, type CollisionDetection } from "@dnd-kit/core";
import { isFolderDropId, isPersonDragId } from "./dndIds";

/** Prefer person sortable targets over enclosing folder droppables when dragging a person. */
export const personCollisionDetection: CollisionDetection = (args) => {
  const collisions = closestCenter(args);
  const activeId = String(args.active.id);

  if (!isPersonDragId(activeId)) return collisions;

  const personHits = collisions.filter(
    (collision) => isPersonDragId(String(collision.id)) && collision.id !== args.active.id,
  );
  if (personHits.length > 0) return personHits;

  const withoutFolderDrops = collisions.filter((collision) => !isFolderDropId(String(collision.id)));
  return withoutFolderDrops.length > 0 ? withoutFolderDrops : collisions;
};
