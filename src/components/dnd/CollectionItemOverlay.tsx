import { EntryRow } from "../ui/EntryRow";

/** Static row preview for drag overlays — matches list row layout without menus or handlers. */
export function CollectionItemOverlay({
  text,
  timestampIso,
  compact = false,
  className = "",
}: {
  text: string;
  timestampIso: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`font-reading overflow-hidden rounded-xl bg-white/95 shadow-lift ring-2 ring-sage/30 backdrop-blur-sm ${className}`}
    >
      <EntryRow text={text} timestampIso={timestampIso} menuItems={[]} compact={compact} />
    </div>
  );
}
