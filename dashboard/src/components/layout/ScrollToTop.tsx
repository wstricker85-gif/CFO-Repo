"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/components/i18n/Language";

export function ScrollToTop() {
  const button = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      button.current?.style.setProperty(
        "--progress",
        `${Math.min(360, Math.max(0, progress * 360))}deg`,
      );
      button.current?.classList.toggle("is-visible", window.scrollY > 240);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  return (
    <button
      ref={button}
      className="scroll-top"
      type="button"
      aria-label={t("Zurück nach oben")}
      title={t("Zurück nach oben")}
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        })
      }
    >
      <span className="scroll-top-inner">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20V4M5.5 10.5 12 4l6.5 6.5" />
        </svg>
      </span>
    </button>
  );
}
