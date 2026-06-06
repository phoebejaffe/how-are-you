import type { RowMenuItem } from "../components/ui/RowMenu";
import { useToastStore } from "../store/toastStore";

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

export function copyToClipboardWithToast(text: string): void {
  void copyTextToClipboard(text).then((ok) => {
    useToastStore.getState().add(ok ? "Copied to clipboard" : "Could not copy", ok ? "success" : "error");
  });
}

export function copyMenuItem(text: string): RowMenuItem {
  return {
    label: "Copy",
    onClick: () => copyToClipboardWithToast(text),
  };
}
