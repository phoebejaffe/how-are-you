import { useEffect, useId, useRef, useState } from "react";
import { searchPlaces, type PlaceResult } from "../../lib/geocoding";

export function LocationSearchInput({
  value,
  onChange,
  onSelectPlace,
  placeholder = "Search address or business…",
}: {
  value: string;
  onChange: (value: string) => void;
  onSelectPlace: (place: PlaceResult) => void;
  placeholder?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);

  useEffect(() => {
    if (!open) return;
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError("");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void searchPlaces(trimmed)
        .then((places) => {
          if (!controller.signal.aborted) setResults(places);
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            setResults([]);
            setError(err instanceof Error ? err.message : "Search failed.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value, open]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="input input-compact w-full"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {open && (loading || results.length > 0 || error) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-stone-200/80"
          style={{ boxShadow: "var(--shadow-lift)" }}
        >
          {loading && <li className="px-3 py-2 text-sm text-ink-muted">Searching…</li>}
          {error && <li className="px-3 py-2 text-sm text-terracotta-dark">{error}</li>}
          {!loading &&
            !error &&
            results.map((place) => (
              <li key={`${place.latitude},${place.longitude},${place.name}`}>
                <button
                  type="button"
                  role="option"
                  className="block w-full px-3 py-2.5 text-left transition-colors active:bg-stone-50"
                  onClick={() => {
                    onSelectPlace(place);
                    setOpen(false);
                  }}
                >
                  <span className="block text-sm text-ink">{place.name}</span>
                  {place.subtitle && (
                    <span className="block truncate text-xs text-ink-muted">{place.subtitle}</span>
                  )}
                </button>
              </li>
            ))}
        </ul>
      )}
      <p className="mt-1 text-[0.6875rem] text-ink-muted">Search places or type a label-only note.</p>
    </div>
  );
}
