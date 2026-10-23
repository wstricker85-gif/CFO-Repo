import type { Metric } from "./contracts.ts";
import type { Threshold } from "./finance.ts";
import { variance } from "./finance.ts";
import { assessmentLabels, formatCompactCurrency, formatDelta, formatValue } from "./format.ts";

export type MetricInsight = {
  title: string;
  definition: string;
  analysis: string;
  formula?: string;
  caveat?: string;
  sourceLabel: string;
};
export function metricInsight(
  metric: Metric,
  context: { period: string; description: string; formula: string; rule: Threshold | null },
): MetricInsight {
  const result: MetricInsight = {
    title: metric.label,
    definition: context.description,
    analysis: "",
    formula: context.formula,
    sourceLabel: `${context.period} · Beispieldaten`,
  };
  if (metric.value === null) {
    result.analysis =
      metric.unavailable_reason ?? "Für diese Kennzahl fehlen die benötigten Daten.";
    result.caveat =
      "Eine fehlende Kennzahl ist kein Nullwert. Eine Bewertung ist hier nicht möglich.";
    return result;
  }
  const fmt = (value: number) =>
    metric.unit === "currency" ? formatCompactCurrency(value) : formatValue(value, metric.unit);
  if (context.rule) {
    const difference = variance(metric.value, context.rule.good);
    const deltaUnit = metric.unit === "percent" ? "percentage_points" : metric.unit;
    const distance =
      deltaUnit === "currency"
        ? formatCompactCurrency(Math.abs(difference.absolute))
        : formatValue(Math.abs(difference.absolute), deltaUnit);
    const relation = difference.absolute > 0 ? "oberhalb" : "unterhalb";
    result.analysis =
      difference.absolute === 0
        ? `Der Zielwert von ${fmt(context.rule.good)} wird genau erreicht.`
        : `Aktuell ${distance} ${relation} des Zielwerts (${fmt(context.rule.good)}).`;
    result.analysis +=
      context.rule.direction === "higher"
        ? " Höhere Werte sind bei dieser Kennzahl günstiger."
        : " Niedrigere Werte sind bei dieser Kennzahl günstiger.";
  } else {
    result.analysis = `Der aktuelle Wert beträgt ${fmt(metric.value)}. Es ist kein Zielkorridor hinterlegt.`;
  }
  if (metric.comparison) {
    const comparison = metric.comparison;
    const assessment =
      comparison.assessment === "unknown"
        ? "ohne Bewertung"
        : assessmentLabels[comparison.assessment];
    result.analysis += ` ${formatDelta(comparison.value, comparison.unit)} ${comparison.label}: ${assessment}.`;
  }
  if (["dso", "dio"].includes(metric.id))
    result.caveat = "Stichtagsbestand als Näherung; keine durchschnittlichen Bestände verfügbar.";
  if (metric.id === "leverage")
    result.caveat =
      "Das YTD-EBITDA wird annualisiert. Saisonalität und rollierende zwölf Monate sind nicht abgebildet.";
  return result;
}

const summaries: Record<string, { definition: string; formula?: string; caveat?: string }> = {
  Bilanzsumme: {
    definition:
      "Gesamtwert der Vermögensseite; identisch zur Summe von Eigen- und Fremdkapital am Stichtag.",
    formula: "Anlagevermögen + Umlaufvermögen = Eigenkapital + Fremdkapital",
  },
  Eigenkapitalquote: {
    definition: "Anteil des Eigenkapitals an der gesamten Bilanzfinanzierung.",
    formula: "Eigenkapital / Bilanzsumme × 100",
    caveat:
      "Keine automatische Bankrating-Einstufung; Branchen- und Unternehmenskontext bleiben relevant.",
  },
  "Anlagendeckung II": {
    definition: "Zeigt, wie weit langfristig verfügbares Kapital das Anlagevermögen deckt.",
    formula: "(Eigenkapital + langfristiges Fremdkapital) / Anlagevermögen × 100",
  },
  "EBIT / Betriebsergebnis": {
    definition: "Operatives Ergebnis nach Abschreibungen, vor Zinsaufwand und Ertragsteuern.",
    formula: "EBITDA − Abschreibungen",
  },
  "Ergebnis nach Steuern": {
    definition:
      "Ergebnis nach operativen Aufwendungen, Abschreibungen, Zinsen und modellierten Ertragsteuern.",
    formula: "EBITDA − Abschreibungen − Zinsaufwand − Ertragsteuern",
    caveat:
      "Ergebnis ist kein Bankbestand. In der Demo erhöht der kumulierte Gewinn ohne Ausschüttungen das Eigenkapital.",
  },
  Nettoergebnismarge: {
    definition: "Anteil des Ergebnisses nach Steuern am Umsatz des gewählten Zeitraums.",
    formula: "Ergebnis nach Steuern / Umsatz × 100",
  },
  "Operativer Cashflow": {
    definition:
      "Zahlungsmittelbeitrag aus der laufenden Geschäftstätigkeit, indirekt aus dem Ergebnis und Bilanzveränderungen ermittelt.",
    formula: "Ergebnis + nicht zahlungswirksame Korrekturen + operative Bestandsänderungen",
    caveat: "Modellierte Zins- und Ertragsteuerzahlungen sind bereits enthalten.",
  },
  "Free Cashflow": {
    definition:
      "Cash, der nach dem operativen Geschäft und den Investitionen vor Finanzierung verbleibt.",
    formula: "Operativer Cashflow + Investitions-Cashflow",
    caveat:
      "Diese Cashflow-Definition ist vom unverschuldeten Bewertungs-FCF im DCF-Modell zu unterscheiden.",
  },
  "Veränderung liquide Mittel": {
    definition: "Nettoveränderung der liquiden Mittel aus allen drei Cashflow-Bereichen.",
    formula: "Operativer Cashflow + Investitions-Cashflow + Finanzierungs-Cashflow",
  },
  "Endbestand liquide Mittel": {
    definition:
      "Liquide Mittel zum Abschlussstichtag; identisch zum Bank- und Kassenbestand der Bilanz.",
    formula: "Anfangsbestand + Summe der Cashflows",
  },
  "Im Ziel": {
    definition: "Anzahl der Kennzahlen, die ihre derzeit gewählten Zielwerte erreichen.",
  },
  Beobachten: { definition: "Anzahl der Kennzahlen zwischen Zielwert und Eingriffsgrenze." },
  Handlungsbedarf: {
    definition: "Anzahl der Kennzahlen außerhalb des gewählten Beobachtungskorridors.",
  },
  Datenlücke: { definition: "Anzahl der Kennzahlen, für die notwendige Eingabedaten fehlen." },
  Umsatz: {
    definition:
      "Umsatzerlöse im gewählten Monats- oder YTD-Zeitraum. Der Planvergleich bezieht sich auf denselben Zeitraum.",
  },
  Rohertragsmarge: {
    definition: "Anteil des Umsatzes, der nach Material und Fremdleistungen verbleibt.",
    formula: "(Umsatz − Material und Fremdleistungen) / Umsatz × 100",
  },
  EBITDA: {
    definition: "Operatives Ergebnis vor Abschreibungen, Zinsen und Steuern.",
    formula: "Umsatz − Material − Personal − sonstige operative Aufwendungen",
    caveat: "EBITDA ist kein Cashflow: Zahlungsziele, Investitionen und Finanzierung fehlen hier.",
  },
  "EBITDA-Marge": {
    definition:
      "Zeigt, wie viel operatives Ergebnis je 100 Euro Umsatz vor Abschreibungen, Zinsen und Steuern verbleibt.",
    formula: "EBITDA / Umsatz × 100",
  },
  "Net Working Capital": {
    definition:
      "Kapitalbindung in operativen Forderungen und Vorräten nach Abzug der Lieferverbindlichkeiten.",
    formula: "Forderungen + Vorräte − Lieferverbindlichkeiten",
  },
  "Cash Conversion Cycle": {
    definition: "Rechnerische Dauer der operativen Kapitalbindung bis zum Zahlungseingang.",
    formula: "DSO + DIO − DPO",
    caveat: "Die Demo nutzt Stichtagsbestände und Materialaufwand als Einkaufs-Proxy.",
  },
  "Forderungen > 30 Tage": {
    definition:
      "Noch offene Rechnungsbeträge, deren Fälligkeit seit mehr als 30 Kalendertagen überschritten ist.",
    caveat: "Eine überfällige Forderung ist noch kein bestätigter Forderungsausfall.",
  },
  Liquiditätsreserve: {
    definition: "Frei verfügbare Mittel oberhalb des gewählten Mindestbestands.",
    formula: "Liquide Mittel − Mindestbestand",
    caveat: "Der Demo-Mindestbestand beträgt 500 Tsd. €. Kreditlinien werden nicht berücksichtigt.",
  },
  "Enterprise Value": {
    definition: "Modellwert des operativen Geschäfts für Eigen- und Fremdkapitalgeber zusammen.",
    formula: "Barwerte der Prognose-FCF + Barwert des Terminalwerts",
    caveat:
      "Kein Kaufpreis und keine geprüfte Unternehmensbewertung. Reagiert auf die Modellregler.",
  },
  "Equity Value": {
    definition: "Modellwert des Eigenkapitals nach Abzug der Nettofinanzschulden.",
    formula: "Enterprise Value − Nettofinanzschulden",
    caveat:
      "Weitere Kaufpreisanpassungen und nicht operative Vermögenswerte sind nicht modelliert.",
  },
  Nettofinanzschulden: {
    definition: "Finanzverbindlichkeiten nach Abzug der liquiden Mittel am Berichtsstichtag.",
    formula: "Finanzschulden − liquide Mittel",
  },
  "Terminalwert-Anteil": {
    definition:
      "Anteil des abgezinsten Werts nach dem fünften Prognosejahr am gesamten Enterprise Value.",
    formula: "Barwert Terminalwert / Enterprise Value × 100",
    caveat:
      "Ein hoher Anteil bedeutet starke Abhängigkeit von langfristigen Wachstums- und Diskontannahmen.",
  },
  "Umsatz Jahreslandung": {
    definition:
      "Erwarteter Jahresumsatz aus unveränderten Ist-Monaten und dem gewählten Restjahresszenario.",
    formula: "YTD-Ist-Umsatz + Forecast-Umsatz der restlichen Monate",
  },
  "EBITDA Jahreslandung": {
    definition:
      "Erwartetes operatives Jahresergebnis nach den gewählten Umsatz- und Kostenannahmen.",
    formula: "YTD-Ist-EBITDA + Forecast-EBITDA der restlichen Monate",
  },
  "EBITDA-Marge Gesamtjahr": {
    definition: "Erwartete operative Marge für das Gesamtjahr aus Ist und Szenario-Forecast.",
    formula: "EBITDA Jahreslandung / Umsatz Jahreslandung × 100",
  },
  "Ist-Abdeckung": {
    definition:
      "Anzahl der abgeschlossenen Ist-Monate im Verhältnis zu den zwölf Monaten des Geschäftsjahres.",
    caveat: "Szenarioänderungen wirken ausschließlich auf die verbleibenden Forecast-Monate.",
  },
  "EUR / USD · Demo": {
    definition:
      "Fiktive Anzahl US-Dollar für einen Euro. Keine aktuelle oder historische Marktbeobachtung.",
    caveat: "Die Demowerte stammen von keinem Marktdatenanbieter.",
  },
  "EUR / CHF · Demo": {
    definition:
      "Fiktive Anzahl Schweizer Franken für einen Euro. Keine aktuelle oder historische Marktbeobachtung.",
    caveat: "Die Demowerte stammen von keinem Marktdatenanbieter.",
  },
  "Basiszins · Demo": {
    definition: "Fiktive Zinsannahme zur Demonstration des Marktumfelds. Keine reale Zinskurve.",
    caveat: "Dieser Wert verändert den WACC im DCF-Modell nicht automatisch.",
  },
  "Peer-Median · Demo": {
    definition: "Mittlerer EV/EBITDA-Vergleichswert von vier frei erfundenen Unternehmen.",
    caveat: "Keine realen Vergleichstransaktionen oder Branchenbenchmarks.",
  },
  "Geprüfte Monate": {
    definition: "Anzahl der vollständig validierten Monatszeilen der lokal ausgewählten CSV-Datei.",
    caveat: "Diese Vorschau bleibt vom Beispielunternehmen getrennt.",
  },
  "Umsatz Vorschau": {
    definition:
      "Summe der Umsatzerlöse in der lokal validierten Datei. Kein automatisch vervollständigtes Geschäftsjahr.",
  },
  "EBITDA Vorschau": {
    definition: "Ergebnis der lokal validierten Datei nach den drei angegebenen Kostenkategorien.",
    formula: "Umsatz − Material − Personal − Sonstiges",
  },
};
export function summaryInsight(label: string, value: string, detail: string): MetricInsight | null {
  const entry = summaries[label];
  if (!entry) return null;
  return {
    title: label,
    ...entry,
    analysis: `In dieser Ansicht: ${value}. ${detail}.`,
    sourceLabel: "Aktuelle Ansicht · Demo / lokale Vorschau",
  };
}
