"use client";
import { useTranslation } from "@/components/i18n/Language";
import Link from "next/link";
import { TourLauncher } from "@/components/shared/DemoGuide";
import { SwissFlag } from "@/components/shared/SwissFlag";
import { useState } from "react";
import { usePathname } from "next/navigation";

type NavigationGroup = { label: string; items: string[][] };
const groups: NavigationGroup[] = [
  {
    label: "Überblick",
    items: [
      ["01", "Übersicht", "/"],
      ["02", "KPI Monitor", "/kpi"],
      ["03", "Finanzanalyse", "/analyse"],
    ],
  },
  {
    label: "Abschluss & Liquidität",
    items: [
      ["04", "GuV", "/guv"],
      ["05", "Bilanz", "/bilanz"],
      ["06", "Cashflow", "/cashflow"],
      ["07", "HGB → IFRS", "/ifrs"],
      ["08", "Working Capital", "/working-capital"],
    ],
  },
  {
    label: "Planung & Bewertung",
    items: [
      ["09", "Bewertung", "/bewertung"],
      ["10", "Budget & Forecast", "/budget"],
      ["11", "Marktdaten", "/markt"],
      ["12", "Board Report", "/board"],
    ],
  },
  {
    label: "Demo selbst ausprobieren",
    items: [
      ["▷", "CSV-Demo & Auswertung", "/daten"],
      ["◎", "Annahmen & Ziele", "/annahmen"],
    ],
  },
  { label: "Individuelle Lösung", items: [["↗", "Dein CFO-Dashboard", "/projekt"]] },
];
export function Sidebar() {
  const { t } = useTranslation();

  const pathname = usePathname().replace(/\/$/, "") || "/";
  const [open, setOpen] = useState(false);
  return (
    <aside className="sidebar">
      <button
        className="mobile-nav-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="dashboard-navigation"
      >
        {t(" Navigation ")}
        <span aria-hidden="true">{t(open ? "−" : "+")}</span>
      </button>
      <div className={`sidebar-content ${open ? "is-open" : ""}`} id="dashboard-navigation">
        <div className="workspace">
          <span className="label">{t("Arbeitsbereich")}</span>
          <strong>{t("Mittelstand GmbH")}</strong>
          <span>{t("Fiktives Demounternehmen")}</span>
        </div>
        <nav aria-label={t("Hauptnavigation")}>
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-caption label">{t(group.label)}</p>
              {group.items.map(([index, label, href]) => (
                <Link
                  key={href}
                  className={`nav-item ${pathname === href ? "is-active" : ""}`}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className="nav-index" aria-hidden="true">
                    {t(index)}
                  </span>
                  {t(label)}
                  {pathname === href && (
                    <span className="nav-arrow" aria-hidden="true">
                      ↗
                    </span>
                  )}
                </Link>
              ))}
              {group.label === "Individuelle Lösung" && (
                <p className="nav-partnership">
                  <SwissFlag />
                  <span>{t("In Kooperation mit Swissi AI")}</span>
                </p>
              )}
            </div>
          ))}
        </nav>
        <div className="mobile-tour-launcher">
          <TourLauncher onLaunch={() => setOpen(false)} />
        </div>
        <div className="nav-utility">
          <p className="nav-planned-note">{t("Demo-Modus · lokal & transparent")}</p>
        </div>
        <div className="sidebar-bottom">
          <span className="label">{t("Finance × Intelligence")}</span>
          <p>
            {t(" Klare Zahlen. ")}
            <br />
            {t(" Fundierte Entscheidungen. ")}
          </p>
          <span className="sidebar-powered">{t("Powered by Swissi AI")}</span>
        </div>
      </div>
    </aside>
  );
}
