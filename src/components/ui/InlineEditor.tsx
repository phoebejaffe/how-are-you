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
      className={`flex flex-wrap items-center gap-2 ${compact ? "py-1" : "py-1.5"}`}
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
        className={`input min-w-0 flex-1 font-reading ${compact ? "input-compact" : ""}`}
        autoFocus
      />
      {showChannel && <ChannelPicker value={draftChannel} onChange={setDraftChannel} />}
      <button type="submit" className="btn-primary btn-compact min-w-11 px-3" aria-label="Save">
        ✔️
      </button>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel"
        className="btn-ghost btn-compact min-w-11 px-3"
      >
        ✕
      </button>
    </form>
  );
}
