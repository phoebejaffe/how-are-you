import { closestCenter, pointerWithin, type CollisionDetection } from "@dnd-kit/core";
import { isFolderDropId, isFolderSortId, isPersonDragId } from "../../dnd/dndIds";

function otherPersonHits(args: Parameters<CollisionDetection>[0]) {
  return closestCenter(args).filter(
    (hit) => isPersonDragId(String(hit.id)) && hit.id !== args.active.id,
  );
}

function otherFolderSortHits(args: Parameters<CollisionDetection>[0]) {
  return closestCenter(args).filter(
    (hit) => isFolderSortId(String(hit.id)) && hit.id !== args.active.id,
  );
}

/** Folder drags sort against folders; person drags target people or folder drop zones. */
export const peopleListCollisionDetection: CollisionDetection = (args) => {
  const activeId = String(args.active.id);

  if (isFolderSortId(activeId)) {
    return otherFolderSortHits(args);
  }

  if (!isPersonDragId(activeId)) {
    return closestCenter(args);
  }

  const pointerHits = pointerWithin(args);
  const overPerson = pointerHits.find(
    (hit) => isPersonDragId(String(hit.id)) && hit.id !== activeId,
  );
  if (overPerson) {
    return otherPersonHits(args);
  }

  const overFolder = pointerHits.find((hit) => isFolderDropId(String(hit.id)));
  if (overFolder) {
    return [overFolder];
  }

  const closest = closestCenter(args)[0];
  if (closest && isPersonDragId(String(closest.id)) && closest.id !== activeId) {
    return otherPersonHits(args);
  }

  return closestCenter(args).filter((hit) => isFolderDropId(String(hit.id)));
};
