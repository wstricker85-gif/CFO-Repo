"use client";
import { useTranslation } from "@/components/i18n/Language";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { metricPanelPosition } from "@/lib/tooltip-layout";
import type { MetricInsight } from "@/lib/insights";

const openEvent = "cfo:metric-info-open";
function positionFor(button: HTMLButtonElement, panel: HTMLDivElement | null) {
  // Keep the popup outside the entire hover surface, not just the small icon.
  // Covering the card can repeatedly remove/re-enter its CSS hover state.
  const anchor = button.closest<HTMLElement>("[data-metric-hover]") ?? button;
  const rect = anchor.getBoundingClientRect();
  const viewport = window.visualViewport;
  return metricPanelPosition(
    rect,
    {
      width: viewport?.width ?? window.innerWidth,
      height: viewport?.height ?? window.innerHeight,
      left: viewport?.offsetLeft ?? 0,
      top: viewport?.offsetTop ?? 0,
    },
    panel?.offsetHeight ?? 285,
  );
}

/** Concise hover tooltip; activating the trigger opens a nonmodal methodology dialog. */
export function MetricInfo({ insight }: { insight: MetricInsight }) {
  const { t } = useTranslation();

  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinned = useRef(false);
  const visible = useRef(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState({ left: 16, top: 16, width: 340, maxHeight: 500 });
  const cancelTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const close = useCallback(() => {
    cancelTimer();
    pinned.current = false;
    visible.current = false;
    setExpanded(false);
    setOpen(false);
  }, [cancelTimer]);
  const show = useCallback(
    (pin = false) => {
      cancelTimer();
      if (!button.current || (visible.current && !pin)) return;
      visible.current = true;
      pinned.current = pin;
      setExpanded(pin);
      setPosition(positionFor(button.current, panel.current));
      window.dispatchEvent(new CustomEvent(openEvent, { detail: id }));
      setOpen(true);
    },
    [cancelTimer, id],
  );
  const leave = useCallback(() => {
    cancelTimer();
    if (!pinned.current)
      timer.current = setTimeout(() => {
        const trigger = button.current;
        const surface = trigger?.closest<HTMLElement>("[data-metric-hover]") ?? trigger;
        // A card and its portal form one hover region. Ignore transient leave
        // events caused by portal insertion or moving between the two surfaces.
        if (
          surface?.matches(":hover") ||
          panel.current?.matches(":hover") ||
          document.activeElement === trigger
        )
          return;
        close();
      }, 180);
  }, [cancelTimer, close]);
  useEffect(() => cancelTimer, [cancelTimer]);
  useEffect(() => {
    const card = button.current?.closest<HTMLElement>("[data-metric-hover]");
    if (!card) return;
    const enter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      cancelTimer();
      if (pinned.current || visible.current) return;
      cancelTimer();
      timer.current = setTimeout(() => show(), 140);
    };
    card.addEventListener("pointerenter", enter);
    card.addEventListener("pointerleave", leave);
    return () => {
      card.removeEventListener("pointerenter", enter);
      card.removeEventListener("pointerleave", leave);
    };
  }, [cancelTimer, leave, show]);
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      if (!button.current) return;
      const rect = button.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        close();
        return;
      }
      setPosition(positionFor(button.current, panel.current));
    };
    const outside = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!button.current?.contains(event.target) && !panel.current?.contains(event.target))
        close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const restore = pinned.current;
        close();
        if (restore) button.current?.focus();
      }
    };
    const another = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) close();
    };
    const frame = requestAnimationFrame(reposition);
    window.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("scroll", reposition);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener(openEvent, another);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("scroll", reposition);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener(openEvent, another);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, expanded, id, close]);

  return (
    <>
      <button
        ref={button}
        type="button"
        className="metric-info-button"
        aria-label={t(`${insight.title}: Erklärung und Einordnung`)}
        aria-describedby={open && !expanded ? id : undefined}
        aria-controls={open && expanded ? id : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") {
            cancelTimer();
            if (!pinned.current && !visible.current) timer.current = setTimeout(() => show(), 120);
          }
        }}
        onPointerLeave={() => {
          if (!button.current?.closest("[data-metric-hover]")) leave();
        }}
        onFocus={() => {
          if (!pinned.current) show();
        }}
        onBlur={leave}
        onClick={() => {
          if (pinned.current) close();
          else show(true);
        }}
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="10" cy="10" r="7.5" />
          <path d="M10 9v5" />
          <circle cx="10" cy="6" r=".7" fill="currentColor" stroke="none" />
        </svg>
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role={expanded ? "dialog" : "tooltip"}
            aria-label={t(expanded ? `${insight.title}: Methodik` : undefined)}
            className="metric-info-panel"
            style={position}
            onPointerEnter={cancelTimer}
            onPointerLeave={leave}
          >
            <span className="metric-info-eyebrow">{t("Kennzahl verstehen")}</span>
            <strong className="metric-info-title">{t(insight.title)}</strong>
            {expanded && <p>{t(insight.definition)}</p>}
            <div className="metric-info-analysis">
              <span>{t("Einordnung")}</span>
              <p>{t(insight.analysis)}</p>
            </div>
            {expanded && insight.formula && <code>{t(insight.formula)}</code>}
            {expanded && insight.caveat && (
              <p className="metric-info-caveat">{t(insight.caveat)}</p>
            )}
            <footer>
              <span>{t(insight.sourceLabel)}</span>
              <span>
                {t(
                  expanded
                    ? "Außerhalb tippen oder Esc schließt"
                    : "Info-Symbol antippen: Definition & Methodik",
                )}
              </span>
            </footer>
          </div>,
          document.body,
        )}
    </>
  );
}
