"use client";
import { useTranslation } from "@/components/i18n/Language";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDemo } from "./DemoProvider";
import { tourChapters, tourSteps, tourIndex, tourProgress, normalizeTourPath } from "@/lib/tour";

export function TourLauncher() {
  const { t } = useTranslation();

  const { tour, dispatchTour } = useDemo();
  if (tour.active)
    return (
      <button
        className="tour-launcher"
        onClick={() => dispatchTour({ type: "stop" })}
        aria-label={t("Rundgang beenden")}
      >
        {t(" Rundgang × ")}
      </button>
    );
  const resume = tour.lastPath !== null && !tour.finished;
  return (
    <Link
      className="tour-launcher"
      href={resume ? tour.lastPath! : "/"}
      onClick={() => dispatchTour(resume ? { type: "resume" } : { type: "start", path: "/" })}
    >
      {t(resume ? "Fortsetzen ↗" : "Rundgang ↗")}
    </Link>
  );
}
function TourIntro() {
  const { t } = useTranslation();

  const path = normalizeTourPath(usePathname());
  const { tour, dispatchTour } = useDemo();
  if (tour.active || (!tour.finished && path !== "/")) return null;
  const progress = tourProgress(tour, path),
    resume = tour.lastPath !== null && !tour.finished;
  return (
    <section
      className="tour-intro"
      aria-label={t(tour.finished ? "Rundgang beendet" : "Vollständiger Dashboard-Rundgang")}
    >
      <div>
        <span className="label">
          {t(
            tour.finished
              ? `${progress.visited.size} von ${tourSteps.length} Stationen besucht`
              : `${tourChapters.length} Kapitel · ${tourSteps.length} Stationen · In deinem Tempo`,
          )}
        </span>
        <h2>
          {t(
            tour.finished
              ? progress.remaining.length
                ? "Rundgang beendet. Weiter frei entdecken."
                : "Das gesamte CFO-Dashboard entdeckt."
              : "Das ganze CFO-Dashboard kennenlernen.",
          )}
        </h2>
        <p>
          {t(
            tour.finished
              ? progress.remaining.length
                ? `${progress.remaining.length} Stationen sind noch offen. Du kannst sie gezielt nachholen.`
                : "Alle Bereiche besucht. Die Funktionen stehen dir weiterhin zum Ausprobieren zur Verfügung."
              : "Kurze Erklärungen und freiwillige Aktionen führen durch alle Bereiche. Du entscheidest, wann es weitergeht.",
          )}
        </p>
      </div>
      <div className="tour-intro-actions">
        {tour.finished && progress.remaining.length > 0 && (
          <Link
            className="button"
            href={progress.remaining[0].path}
            onClick={() => dispatchTour({ type: "resume" })}
          >
            {t(" Offene Stationen ansehen ↗ ")}
          </Link>
        )}
        <Link
          className="button primary-button"
          href={resume ? tour.lastPath! : "/"}
          onClick={() => dispatchTour(resume ? { type: "resume" } : { type: "start", path: "/" })}
        >
          {t(
            resume
              ? "Rundgang fortsetzen ↗"
              : tour.finished
                ? "Neu starten ↗"
                : "Rundgang starten ↗",
          )}
        </Link>
      </div>
    </section>
  );
}
export function TourLayout({ children }: { children: React.ReactNode }) {
  const path = normalizeTourPath(usePathname());
  const { tour, dispatchTour } = useDemo();
  const index = tourIndex(path);
  useEffect(() => {
    if (tour.active) dispatchTour({ type: "visit", path });
  }, [tour.active, path, dispatchTour]);
  useEffect(() => {
    if (!tour.active || index < 0) return;
    let target: HTMLElement | null = null;
    let oldTab: string | null = null;
    const frame = requestAnimationFrame(() => {
      target =
        document.querySelector(".tour-page")?.querySelector<HTMLElement>(tourSteps[index].target) ??
        null;
      if (!target) return;
      target.setAttribute("data-tour-highlight", "");
      oldTab = target.getAttribute("tabindex");
      if (oldTab === null && !target.matches("a,button,input,select,textarea"))
        target.setAttribute("tabindex", "-1");
    });
    return () => {
      cancelAnimationFrame(frame);
      if (target) {
        target.removeAttribute("data-tour-highlight");
        if (oldTab === null && !target.matches("a,button,input,select,textarea"))
          target.removeAttribute("tabindex");
      }
    };
  }, [tour.active, index]);
  return (
    <div className={`tour-layout ${tour.active ? "tour-is-active" : ""}`}>
      <div className="tour-page">
        <TourIntro />
        {children}
      </div>
      {tour.active && <DemoGuide />}
    </div>
  );
}
export function DemoGuide() {
  const { t } = useTranslation();

  const path = normalizeTourPath(usePathname());
  const { tour, dispatchTour } = useDemo();
  const [expanded, setExpanded] = useState(false);
  const progress = tourProgress(tour, path),
    step = progress.step;
  const closeMobile = () => setExpanded(false);
  function showTarget() {
    if (!step) return;
    const target = document.querySelector(".tour-page")?.querySelector<HTMLElement>(step.target);
    if (!target) return;
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "center",
    });
    target.focus({ preventScroll: true });
    setExpanded(false);
  }
  return (
    <aside
      className="tour-rail"
      aria-label={t("Begleitung zum Dashboard-Rundgang")}
      data-expanded={expanded ? "true" : "false"}
    >
      <div className="tour-panel">
        <div className="tour-panel-heading" aria-live="polite" aria-atomic="true">
          <span className="label">
            {t(step ? `Station ${progress.index + 1} von ${tourSteps.length}` : "Rundgang")}
          </span>
          <strong>{t(step?.chapter ?? "Frei erkunden")}</strong>
        </div>
        <progress
          className="tour-meter"
          value={progress.visited.size}
          max={tourSteps.length}
          aria-label={t(`${progress.visited.size} von ${tourSteps.length} Stationen besucht`)}
        />
        <button
          className="tour-mobile-toggle"
          aria-expanded={expanded}
          aria-controls="tour-panel-content"
          onClick={() => setExpanded(!expanded)}
        >
          {t(expanded ? "Begleitung einklappen −" : "Erklärung & Stationen öffnen +")}
        </button>
        <div className="tour-panel-content" id="tour-panel-content">
          <h2>{t(step?.title ?? "Eine Station auswählen")}</h2>
          {step ? (
            <>
              <p>{t(step.description)}</p>
              <p className="tour-benefit">{t(step.benefit)}</p>
              <div className="tour-try">
                <span className="label">{t("Freiwillig ausprobieren")}</span>
                <p>{t(step.tryIt)}</p>
                <button className="text-button" onClick={showTarget}>
                  {t(" Stelle anzeigen ↓ ")}
                </button>
              </div>
              <p className="tour-data-note">{t(step.dataNote)}</p>
            </>
          ) : (
            <p>
              {t(
                " Diese Seite ist keine Station. Über die Liste kannst du zum Rundgang zurückkehren. ",
              )}
            </p>
          )}
          <div className="tour-pagination">
            {progress.previous ? (
              <Link className="button" href={progress.previous.path} onClick={closeMobile}>
                {t(" ← Zurück ")}
              </Link>
            ) : (
              <span />
            )}
            {step ? (
              progress.next ? (
                <Link
                  className="button primary-button"
                  href={progress.next.path}
                  onClick={closeMobile}
                >
                  {t(" Weiter → ")}
                </Link>
              ) : (
                <button
                  className="button primary-button"
                  onClick={() => dispatchTour({ type: "finish" })}
                >
                  {t(" Abschließen ✓ ")}
                </button>
              )
            ) : (
              <Link className="button" href={tour.lastPath ?? "/"} onClick={closeMobile}>
                {t(" Zur Station ↗ ")}
              </Link>
            )}
          </div>
          <p className="tour-visited-count">
            {progress.visited.size} {t(" von ")}
            {tourSteps.length} {t(" besucht · Ausprobieren ist optional ")}
          </p>
          <details className="tour-stations">
            <summary>{t("Alle Stationen & Fortschritt")}</summary>
            <nav aria-label={t("Rundgang-Stationen")}>
              {tourChapters.map((chapter) => (
                <div className="tour-chapter" key={chapter}>
                  <h3>{t(chapter)}</h3>
                  <ol>
                    {tourSteps
                      .filter((s) => s.chapter === chapter)
                      .map((s) => (
                        <li key={s.path}>
                          <Link
                            href={s.path}
                            onClick={closeMobile}
                            aria-current={path === s.path ? "step" : undefined}
                          >
                            <span className="tour-station-mark" aria-hidden="true">
                              {t(progress.visited.has(s.path) ? "✓" : "○")}
                            </span>
                            <span>{t(s.label)}</span>
                            <span className="sr-only">
                              {t(
                                progress.visited.has(s.path) ? ", bereits besucht" : ", noch offen",
                              )}
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ol>
                </div>
              ))}
            </nav>
          </details>
          <button className="text-button tour-stop" onClick={() => dispatchTour({ type: "stop" })}>
            {t(" Rundgang beenden ")}
          </button>
          <p className="tour-session-note">
            {t(
              " Über „Fortsetzen“ wieder einsteigen. Fortschritt bleibt bis zum Neuladen erhalten. ",
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}
export function ContactCta() {
  const { t } = useTranslation();

  const pathname = normalizeTourPath(usePathname());
  if (pathname === "/daten" || pathname === "/projekt") return null;
  return (
    <aside className="contact-cta">
      <div>
        <strong>{t("Mehr Klarheit für dein Unternehmen?")}</strong>
        <p>
          {t(
            "Individuelles CFO-Dashboard und AI-Integration in Kooperation mit Swissi Holding AG.",
          )}
        </p>
      </div>
      <Link className="button" href="/projekt">
        {t(" Individuelle Lösung ansehen ↗ ")}
      </Link>
    </aside>
  );
}
