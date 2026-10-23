import type { Assessment, MetricStatus, Unit } from "./contracts.ts";

import { getLanguage, getLocale, translate, type Language } from "./i18n.ts";
const decimal = {
  format: (value: number, language: Language) =>
    new Intl.NumberFormat(getLocale(language), { maximumFractionDigits: 1 }).format(value),
};
const amount = {
  format: (value: number, language: Language) =>
    new Intl.NumberFormat(getLocale(language), {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value),
};

export function formatValue(
  value: number | null,
  unit: Unit,
  language: Language = getLanguage(),
): string {
  if (value === null) return translate("Nicht verfügbar", language);
  switch (unit) {
    case "currency":
      return amount.format(value, language);
    case "percent":
      return `${decimal.format(value, language)} %`;
    case "percentage_points":
      return `${decimal.format(value, language)} ${language === "en" ? "pp" : "PP"}`;
    case "days":
      return `${decimal.format(value, language)} ${language === "en" ? "days" : "Tage"}`;
    case "multiple":
      return `${decimal.format(value, language)}×`;
    default:
      return decimal.format(value, language);
  }
}
export function formatCompactCurrency(value: number, language: Language = getLanguage()): string {
  if (language === "en")
    return Math.abs(value) >= 1_000_000
      ? `€${new Intl.NumberFormat(getLocale(language), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 1_000_000)}m`
      : `€${decimal.format(value / 1_000, language)}k`;
  return Math.abs(value) >= 1_000_000
    ? `${new Intl.NumberFormat(getLocale(language), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 1_000_000)} Mio. €`
    : `${decimal.format(value / 1_000, language)} Tsd. €`;
}
export function formatDelta(value: number, unit: Unit, language: Language = getLanguage()): string {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatValue(Math.abs(value), unit, language)}`;
}
export const statusLabels: Record<MetricStatus, string> = {
  good: "Im Ziel",
  watch: "Beobachten",
  warning: "Handlungsbedarf",
  critical: "Kritisch",
  neutral: "Ohne Bewertung",
  unavailable: "Nicht verfügbar",
};
export const assessmentLabels: Record<Assessment, string> = {
  improving: "Verbesserung",
  stable: "Unverändert",
  deteriorating: "Verschlechterung",
  unknown: "Ohne Bewertung",
};

export function formatStatementAmount(
  value: number,
  scale: "eur" | "thousand",
  language: Language = getLanguage(),
) {
  return new Intl.NumberFormat(getLocale(language), {
    minimumFractionDigits: scale === "thousand" ? 1 : 0,
    maximumFractionDigits: scale === "thousand" ? 1 : 0,
  }).format(scale === "thousand" ? value / 1000 : value);
}
export function formatDate(value: string, language: Language = getLanguage()): string {
  return new Intl.DateTimeFormat(getLocale(language), { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}
