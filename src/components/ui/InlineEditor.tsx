import { useState } from "react";
import type { Channel } from "../../types";
import { ChannelPicker } from "./ChannelPicker";

export function InlineEditor({
  text,
  channel,
  onSave,
  onCancel,
  compact = false,
  showChannel = true,
}: {
  text: string;
  channel: Channel;
  onSave: (text: string, channel: Channel) => void;
  onCancel: () => void;
  compact?: boolean;
  showChannel?: boolean;
}) {
  const [draft, setDraft] = useState(text);
  const [draftChannel, setDraftChannel] = useState(channel);

  return (
    <form
      className={`flex flex-wrap items-center gap-1 ${compact ? "" : "py-0.5"}`}
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = draft.trim();
        if (!trimmed) return;
        onSave(trimmed, showChannel ? draftChannel : channel);
      }}
    >
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className={`min-w-0 flex-1 rounded border border-stone-300 px-2 text-stone-800 ${
          compact ? "py-0.5 text-xs" : "py-1 text-sm"
        }`}
        autoFocus
      />
      {showChannel && <ChannelPicker value={draftChannel} onChange={setDraftChannel} />}
      <button
        type="submit"
        className={`rounded bg-sage text-white ${compact ? "px-2 py-0.5 text-xs" : "px-2 py-1 text-xs"}`}
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel"
        className={`flex min-h-10 min-w-10 items-center justify-center rounded text-stone-500 active:bg-stone-100 ${compact ? "text-xs" : "text-xs"}`}
      >
        X
      </button>
    </form>
  );
}
