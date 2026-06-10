import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TOOLTIP_TEXT =
  "Friends with a saved location within 500 feet of you.";

export function InfoTooltip({ label = "More information" }: { label?: string }) {
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!visible || !buttonRef.current) return;

    function updatePosition() {
      const button = buttonRef.current;
      const tooltip = tooltipRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const tooltipWidth = tooltip?.offsetWidth ?? 208;
      const tooltipHeight = tooltip?.offsetHeight ?? 40;
      const margin = 8;

      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));

      let top = rect.bottom + 6;
      if (top + tooltipHeight > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - tooltipHeight - 6);
      }

      setStyle({
        position: "fixed",
        top,
        left,
        zIndex: 200,
        visibility: "visible",
      });
    }

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [visible]);

  const tooltip =
    visible &&
    createPortal(
      <span
        ref={tooltipRef}
        role="tooltip"
        style={style}
        className="pointer-events-none w-52 rounded-lg bg-ink px-2.5 py-1.5 text-center font-sans text-[11px] font-normal normal-case tracking-normal text-cream shadow-md"
      >
        {TOOLTIP_TEXT}
      </span>,
      document.body,
    );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/80 font-sans text-[10px] font-semibold leading-none text-bi-purple ring-1 ring-bi-pink/35 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-bi-blue/40"
        aria-label={label}
        title={TOOLTIP_TEXT}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        i
      </button>
      {tooltip}
    </>
  );
}
