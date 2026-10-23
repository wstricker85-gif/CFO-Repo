import { translate } from "./i18n.ts";
import type { DemoRules } from "./demo-policy.ts";
import { getKpis } from "./demo-company.ts";
import { metricInsight } from "./insights.ts";
import { getIncomeStatement, getBalanceStatement, getCashflowStatement } from "./statements.ts";
import type { DemoSnapshot } from "./demo-data.ts";
import { getCapital, getPnl } from "./demo-company.ts";
import { cashForecast } from "./finance.ts";
import { getCashPlan } from "./demo-company.ts";
import { formatCompactCurrency, formatDelta, formatValue, statusLabels } from "./format.ts";

export function buildReport(
  snapshot: DemoSnapshot,
  options: {
    notes: string;
    includeCash: boolean;
    includeRisks: boolean;
    full: boolean;
    rules?: DemoRules;
  },
) {
  const c = getCapital(snapshot.id),
    pnl = getPnl(snapshot.id),
    forecast = cashForecast(c.cash, getCashPlan(snapshot.id));
  const income = getIncomeStatement(snapshot.id),
    balance = getBalanceStatement(snapshot.id),
    historicalCash = getCashflowStatement(snapshot.id);
  const statementSummary = [
    { label: "Periodenergebnis nach Steuern", value: income.netIncome },
    { label: "Bilanzsumme zum Stichtag", value: balance.totals.assets },
    { label: "Eigenkapital zum Stichtag", value: balance.totals.equity },
    { label: "Operativer Cashflow im Monat", value: historicalCash.operating },
    { label: "Investitions-Cashflow im Monat", value: historicalCash.investing },
    { label: "Finanzierungs-Cashflow im Monat", value: historicalCash.financing },
    { label: "Veränderung liquide Mittel im Monat", value: historicalCash.cashChange },
  ];
  const dso = getKpis(snapshot.id, options.rules).find((d) => d.metric.id === "dso")!;
  const dsoAnalysis = metricInsight(dso.metric, {
    period: snapshot.label,
    description: dso.description,
    formula: dso.formula,
    rule: dso.rule,
  }).analysis;
  const paragraphs = [
    `Der Umsatz beträgt im ${snapshot.label} ${formatCompactCurrency(pnl[0].actual)} und liegt damit ${formatDelta(pnl[0].variancePercent ?? 0, "percent")} zum Plan. Das EBITDA erreicht ${formatCompactCurrency(pnl[5].actual)}; die EBITDA-Marge beträgt ${formatValue((pnl[5].actual / pnl[0].actual) * 100, "percent")}.`,
    `Die additive Ergebnisbrücke zeigt einen Umsatzbeitrag von ${formatDelta(pnl[0].variance, "currency")} gegenüber Plan. Material und Fremdleistungen weichen um ${formatDelta(pnl[1].variance, "currency")} ab; sonstige Aufwendungen um ${formatDelta(pnl[4].variance, "currency")}. Preis- und Mengeneffekte sind im Datensatz nicht getrennt und werden deshalb nicht als Ursachen behauptet.`,
    `Zum Stichtag stehen ${formatCompactCurrency(c.cash)} liquide Mittel zur Verfügung. ${dsoAnalysis} Die empfohlenen nächsten Schritte sind die Priorisierung überfälliger Posten und die Prüfung der Kostenabweichungen. Eine Umsetzung dieser Maßnahmen wird im Demo-System nicht bestätigt.`,
  ];
  const risks = [
    `${formatCompactCurrency(c.overdue30)} Forderungen sind mehr als 30 Tage überfällig. Empfohlene Maßnahme: größte Posten mit dem Debitorenmanagement abstimmen.`,
    `Der größte Kunde trägt ${c.concentration} % zum Monatsumsatz bei. Konzentration beobachten und alternative Umsatzquellen entwickeln.`,
    "Personal- und FTE-Daten fehlen. Umsatz je FTE ist nicht verfügbar und wird nicht als Null ausgewiesen.",
  ];
  const escapeCell = (text: string) => text.replaceAll("|", "\\|").replaceAll("\n", " ");
  const lines = [
    `# CFO ${options.full ? "Board Pack" : "Executive Flash"} — ${snapshot.label}`,
    "",
    "> DEMO — fiktives Unternehmen, fiktive Daten. Keine ausgeführte KI-Analyse.",
    "",
    `## ${snapshot.headline}`,
    "",
    snapshot.summary,
    "",
    "## Kennzahlen",
    "",
    "| Kennzahl | Wert | Bewertung |",
    "|---|---:|---|",
    ...snapshot.result.metrics.map(
      (m) =>
        `| ${escapeCell(m.label)} | ${formatValue(m.value, m.unit)} | ${statusLabels[m.status]} |`,
    ),
    "",
    ...(options.full
      ? [
          "## CFO-Kommentar",
          "",
          ...paragraphs.flatMap((p) => [p, ""]),
          "## Bilanz, GuV und historischer Cashflow",
          "",
          ...statementSummary.map((r) => `- ${r.label}: ${formatValue(r.value, "currency")}.`),
          "",
          "## Ergebnisrechnung",
          "",
          "| Position | Ist | Plan | Abweichung |",
          "|---|---:|---:|---:|",
          ...pnl.map(
            (r) =>
              `| ${escapeCell(r.label)} | ${formatValue(r.actual, "currency")} | ${formatValue(r.budget, "currency")} | ${formatDelta(r.variance, "currency")} |`,
          ),
          "",
        ]
      : []),
    ...(options.includeRisks
      ? ["## Risiken & Datenlücken", "", ...risks.map((r) => `- ${r}`), ""]
      : []),
    ...(options.includeCash
      ? [
          "## Liquiditätsvorschau — Demo-Annahmen",
          "",
          ...forecast.map(
            (m) =>
              `- ${m.month} 2026: Endbestand ${formatCompactCurrency(m.closing)}; Netto-Cashflow ${formatDelta(m.net, "currency")}.`,
          ),
          "",
        ]
      : []),
    "## Empfohlene Maßnahmen",
    "",
    ...snapshot.actions.map((a) => `- ${a.title} — ${a.owner}, Demo-Zieldatum ${a.due}.`),
    "",
    ...(options.notes.trim() ? ["## Management-Ergänzungen", "", options.notes.trim(), ""] : []),
    "## Datenbasis & Annahmen",
    "",
    `- Unternehmen: Mittelstand GmbH (fiktiv).`,
    `- Berichtsperiode: ${snapshot.result.period.start} bis ${snapshot.end}.`,
    `- Datenstand: ${snapshot.result.data_cutoff}.`,
    "- Quelle: lokal hinterlegter Demo-Monatsabschluss; Beträge in EUR.",
    ...getKpis(snapshot.id, options.rules)
      .filter((d) => d.rule)
      .map(
        (d) =>
          `- Ziel ${d.metric.label}: ${d.rule!.direction === "higher" ? "≥" : "≤"} ${formatValue(d.rule!.good, d.metric.unit)}; Beobachtungsgrenze ${formatValue(d.rule!.watch, d.metric.unit)}.`,
      ),
    "- Working Capital verwendet Stichtagsbestände als Näherung; Materialaufwand als Einkäufe-Proxy.",
    "- Cash-Prognose beruht auf eigenen fiktiven Ein-/Auszahlungsannahmen.",
    "- Keine unabhängige Prüfung, keine bestätigten Management-Maßnahmen.",
  ];
  return {
    paragraphs,
    risks,
    forecast,
    statementSummary,
    markdown: lines
      .map((line) => (line === options.notes.trim() ? line : translate(line)))
      .join("\n"),
  };
}
