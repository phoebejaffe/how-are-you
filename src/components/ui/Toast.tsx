import { useToastStore } from "../../store/toastStore";

function typeClass(type: string): string {
  switch (type) {
    case "success":
      return "bg-sage-dark";
    case "error":
      return "bg-terracotta-dark";
    default:
      return "bg-stone-700";
  }
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-[100] flex flex-col-reverse items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const showCountdown = toast.action != null && toast.durationMs != null;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-lg shadow-lg ${typeClass(toast.type)}`}
            role="status"
          >
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white">
              <span className="flex-1">{toast.message}</span>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    remove(toast.id);
                  }}
                  className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold underline underline-offset-2"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(toast.id, { userDismissed: true })}
                aria-label="Dismiss"
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
            {showCountdown && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-black/25" aria-hidden="true">
                <div
                  className="toast-countdown h-full w-full origin-left bg-amber-300 motion-reduce:animate-none"
                  style={{ animationDuration: `${toast.durationMs}ms` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
