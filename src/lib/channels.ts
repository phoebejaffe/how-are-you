import type { Channel } from "../types";

export const CHANNEL_LABELS: Record<Channel, string> = {
  call: "Call",
  text: "Text",
  in_person: "In person",
};

export const CHANNEL_ICONS: Record<Channel, string> = {
  call: "📞",
  text: "💬",
  in_person: "👤",
};

/** Display order for the channel button group (call in the middle). */
export const CHANNEL_ORDER: Channel[] = ["text", "call", "in_person"];

export const CHANNEL_OPTIONS = CHANNEL_ORDER.map((value) => ({
  value,
  label: CHANNEL_LABELS[value],
}));
