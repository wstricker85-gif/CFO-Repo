import type { Assessment, MetricStatus, Unit } from "./contracts.ts";

import { getLanguage, getLocale, translate } from "./i18n.ts";
const decimal = {
  format: (value: number) =>
    new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }).format(value),
};
const amount = {
  format: (value: number) =>
    new Intl.NumberFormat(getLocale(), {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value),
};

export function formatValue(value: number | null, unit: Unit): string {
  if (value === null) return translate("Nicht verfügbar");
  switch (unit) {
    case "currency":
      return amount.format(value);
    case "percent":
      return `${decimal.format(value)} %`;
    case "percentage_points":
      return `${decimal.format(value)} ${getLanguage() === "en" ? "pp" : "PP"}`;
    case "days":
      return `${decimal.format(value)} ${getLanguage() === "en" ? "days" : "Tage"}`;
    case "multiple":
      return `${decimal.format(value)}×`;
    default:
      return decimal.format(value);
  }
}
export function formatCompactCurrency(value: number): string {
  if (getLanguage() === "en")
    return Math.abs(value) >= 1_000_000
      ? `€${new Intl.NumberFormat(getLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 1_000_000)}m`
      : `€${decimal.format(value / 1_000)}k`;
  return Math.abs(value) >= 1_000_000
    ? `${new Intl.NumberFormat(getLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 1_000_000)} Mio. €`
    : `${decimal.format(value / 1_000)} Tsd. €`;
}
export function formatDelta(value: number, unit: Unit): string {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatValue(Math.abs(value), unit)}`;
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

export function formatStatementAmount(value: number, scale: "eur" | "thousand") {
  return new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: scale === "thousand" ? 1 : 0,
    maximumFractionDigits: scale === "thousand" ? 1 : 0,
  }).format(scale === "thousand" ? value / 1000 : value);
}
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(getLocale(), { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}
