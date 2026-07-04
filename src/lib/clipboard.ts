import type { RowMenuItem } from "../components/ui/RowMenu";
import { useToastStore } from "../store/toastStore";

function fallbackCopyText(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.width = "1px";
  textarea.style.height = "1px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
  return ok;
}

async function copyResolvedText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to execCommand
    }
  }
  return fallbackCopyText(text);
}

async function copyTextPromise(textPromise: Promise<string>): Promise<boolean> {
  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": textPromise.then((text) => new Blob([text], { type: "text/plain" })),
        }),
      ]);
      return true;
    } catch {
      // fall through once data is ready
    }
  }

  try {
    return copyResolvedText(await textPromise);
  } catch {
    return false;
  }
}

export async function copyTextToClipboard(text: string | Promise<string>): Promise<boolean> {
  if (typeof text === "string") {
    return copyResolvedText(text);
  }
  return copyTextPromise(text);
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
