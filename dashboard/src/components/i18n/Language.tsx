"use client";
import { useSyncExternalStore, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  getLanguage,
  getLocale,
  subscribeLanguage,
  serverLanguage,
  setLanguage,
  translate,
  type Language,
} from "@/lib/i18n";
export function useTranslation() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, serverLanguage);
  return {
    language,
    locale: getLocale(language),
    t: <T extends string | null | undefined>(value: T) => translate(value, language),
  };
}
export function LanguageToggle() {
  const { language } = useTranslation();
  return (
    <div
      className="language-toggle"
      role="group"
      aria-label={language === "de" ? "Sprache wählen" : "Choose language"}
    >
      {(["de", "en"] as Language[]).map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          aria-label={lang === "de" ? "Deutsch" : "English"}
          aria-pressed={language === lang}
          onClick={() => setLanguage(lang)}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
const pageNames: Record<string, string> = {
  "/": "Übersicht",
  "/kpi": "KPI Monitor",
  "/analyse": "Finanzanalyse",
  "/guv": "GuV",
  "/bilanz": "Bilanz",
  "/cashflow": "Cashflow",
  "/ifrs": "HGB → IFRS",
  "/working-capital": "Working Capital",
  "/bewertung": "Bewertung",
  "/budget": "Budget & Forecast",
  "/markt": "Marktdaten",
  "/board": "Board Report",
  "/daten": "CSV-Demo & Auswertung",
  "/annahmen": "Annahmen & Ziele",
  "/projekt": "Individuelles Dashboard",
};
export function LanguageDocument() {
  const { language } = useTranslation();
  const path = usePathname().replace(/\/$/, "") || "/";
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("lang");
    if (requested === "de" || requested === "en") {
      setLanguage(requested);
      return;
    }
    try {
      const saved = localStorage.getItem("cfo-language");
      if (saved === "en" || saved === "de") setLanguage(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `${translate(pageNames[path] ?? "CFO Dashboard", language)} · CFO Dashboard · Stricker Interim`;
  }, [language, path]);
  return null;
}
export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a className="skip-link" href="#main-content">
      {t("Zum Inhalt springen")}
    </a>
  );
}
