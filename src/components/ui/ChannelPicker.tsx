import { CHANNEL_LABELS, CHANNEL_OPTIONS } from "../../lib/channels";
import type { Channel } from "../../types";
import { ChannelIcon } from "./ChannelIcon";

export function ChannelPicker({
  value,
  onChange,
}: {
  value: Channel;
  onChange: (channel: Channel) => void;
}) {
  return (
    <div className="flex shrink-0 gap-0.5" role="group" aria-label="Channel">
      {CHANNEL_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={CHANNEL_LABELS[opt.value]}
          aria-label={CHANNEL_LABELS[opt.value]}
          aria-pressed={value === opt.value}
          className={`rounded px-2 py-1 text-sm transition ${
            value === opt.value
              ? "bg-stone-200 grayscale-[30%] opacity-70"
              : "grayscale opacity-40 hover:bg-stone-50 hover:opacity-55"
          }`}
        >
          <ChannelIcon channel={opt.value} />
        </button>
      ))}
    </div>
  );
}
