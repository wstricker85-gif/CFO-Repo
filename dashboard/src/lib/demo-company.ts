import { getLocale } from "./i18n.ts";
import { getBalanceSeed, balanceTotals } from "./demo-ledger.ts";
import { metricSchema, type Metric } from "./contracts.ts";
import { revenueHistory, demoSnapshots, type PerformanceRow } from "./demo-data.ts";
import {
  agingBucket,
  classify,
  divide,
  overdueDays,
  round,
  variance,
  type Threshold,
} from "./finance.ts";

export const company = {
  name: "Mittelstand GmbH",
  currency: "EUR",
  financialYear: 2026,
  source: "demo-ledger-2026",
};
export const scenarios = [
  {
    id: "base",
    label: "Basis",
    revenueChange: 0,
    fixedCostChange: 0,
    description: "Umsatz und Kosten wie im Demo-Forecast.",
  },
  {
    id: "upside",
    label: "Chancen",
    revenueChange: 10,
    fixedCostChange: 0,
    description: "10 % mehr Umsatz; variable Kosten steigen proportional.",
  },
  {
    id: "downside",
    label: "Risiken",
    revenueChange: -10,
    fixedCostChange: 5,
    description: "10 % weniger Umsatz; fixe Kosten steigen um 5 %.",
  },
] as const;
export function getPnl(period: string, ytd = false): PerformanceRow[] {
  const snapshot = demoSnapshots.find((s) => s.id === period) ?? demoSnapshots[0];
  if (!ytd) return snapshot.rows;
  const rows = revenueHistory.slice(0, snapshot.count).map((m, index) => {
    const existing = demoSnapshots.find((s) => s.count === index + 1);
    if (existing) return existing.rows;
    const material = round(m.revenue * 0.54);
    const personnel = 225000 + index * 1000;
    const overhead = round(m.revenue - material - personnel - m.ebitda);
    const budgetMaterial = round(m.budget * 0.54);
    const budgetPersonnel = personnel;
    const budgetOverhead = round(m.budget * 0.11);
    const values = [
      [m.revenue, m.budget],
      [material, budgetMaterial],
      [m.revenue - material, m.budget - budgetMaterial],
      [personnel, budgetPersonnel],
      [overhead, budgetOverhead],
      [m.ebitda, m.budget - budgetMaterial - budgetPersonnel - budgetOverhead],
    ];
    return snapshot.rows.map((row, i) => ({ ...row, actual: values[i][0], budget: values[i][1] }));
  });
  return snapshot.rows.map((row, index) => {
    const actual = round(rows.reduce((sum, month) => sum + month[index].actual, 0));
    const budget = round(rows.reduce((sum, month) => sum + month[index].budget, 0));
    const result = variance(actual, budget, [1, 3, 4].includes(index));
    return {
      ...row,
      actual,
      budget,
      variance: result.absolute,
      variancePercent: result.percent,
      assessment: result.assessment,
    };
  });
}
export function getCapital(period: string) {
  const snapshot = demoSnapshots.find((s) => s.id === period) ?? demoSnapshots[0];
  const september = snapshot.id === "2026-09";
  const balance = getBalanceSeed(snapshot.id);
  const totals = balanceTotals(balance);
  return {
    cash: balance.cash,
    days: september ? 30 : 31,
    receivables: balance.receivables,
    inventory: balance.inventory,
    payables: balance.payables,
    dso: september ? 46 : 49,
    dio: september ? 48 : 51,
    dpo: september ? 42 : 43,
    ccc: september ? 52 : 57,
    nwc: round(balance.receivables + balance.inventory - balance.payables),
    debt: balance.shortDebt + balance.longDebt,
    currentAssets: round(totals.currentAssets),
    currentLiabilities: round(totals.currentLiabilities),
    equity: round(totals.equity),
    totalAssets: round(totals.assets),
    overdue30: september ? 172000 : 152000,
    concentration: september ? 31 : 32,
  };
}

export type KpiDefinition = {
  metric: Metric;
  category: "Ertrag" | "Liquidität" | "Effizienz" | "Risiko";
  description: string;
  formula: string;
  rule: Threshold | null;
  history: number[];
};
export function getKpis(period: string, rules: Record<string, Threshold> = {}): KpiDefinition[] {
  const snapshot = demoSnapshots.find((s) => s.id === period) ?? demoSnapshots[0];
  const c = getCapital(period);
  const pnl = snapshot.rows;
  const ytdEbitda = getPnl(period, true)[5].actual;
  const make = (
    id: string,
    label: string,
    value: number | null,
    unit: Metric["unit"],
    category: KpiDefinition["category"],
    rule: Threshold | null,
    target: string,
    description: string,
    formula: string,
    history: number[] = [],
  ): KpiDefinition => {
    rule = rules[id] ?? rule;
    if (rules[id] && rule)
      target = `Ziel: ${rule.direction === "higher" ? "≥" : "≤"} ${rule.good.toLocaleString(getLocale())} ${unit === "days" ? "Tage" : unit === "percent" ? "%" : unit === "currency" ? "€" : "×"}`;
    const existing = snapshot.metrics.find((m) => m.id === id);
    const metric = metricSchema.parse({
      id,
      label,
      value: value === null ? null : round(value, 1),
      unit,
      status: value === null ? "unavailable" : rule ? classify(value, rule) : "neutral",
      comparison: existing?.comparison ?? null,
      target,
      unavailable_reason: value === null ? "Keine Personaldaten im Demodatensatz vorhanden." : null,
      evidence_ids: [company.source],
    });
    return { metric, category, rule, description, formula, history };
  };
  const history = revenueHistory.slice(0, snapshot.count);
  return [
    make(
      "revenue",
      "Umsatz",
      pnl[0].actual,
      "currency",
      "Ertrag",
      { direction: "higher", good: pnl[0].budget, watch: pnl[0].budget * 0.95 },
      "Mindestens Monatsplan",
      "Erfasste Umsatzerlöse der Berichtsperiode.",
      "Summe der Umsatzerlöse",
      history.map((m) => m.revenue),
    ),
    make(
      "ebitda-margin",
      "EBITDA-Marge",
      (pnl[5].actual / pnl[0].actual) * 100,
      "percent",
      "Ertrag",
      { direction: "higher", good: 15, watch: 10 },
      "Mindestens 15 %",
      "Operative Ergebnisquote vor Zinsen, Steuern und Abschreibungen.",
      "EBITDA / Umsatz × 100",
      history.map((m) => round((m.ebitda / m.revenue) * 100, 1)),
    ),
    make(
      "gross-margin",
      "Rohertragsmarge",
      (pnl[2].actual / pnl[0].actual) * 100,
      "percent",
      "Ertrag",
      { direction: "higher", good: 40, watch: 30 },
      "Mindestens 40 %",
      "Anteil nach Material und Fremdleistungen.",
      "Rohertrag / Umsatz × 100",
    ),
    make(
      "cash",
      "Liquide Mittel",
      c.cash,
      "currency",
      "Liquidität",
      { direction: "higher", good: 500000, watch: 300000 },
      "Mindestens 500 Tsd. €",
      "Frei verfügbare Bank- und Kassenbestände am Stichtag.",
      "Bank + Kasse",
      [640000, 680000, 712000, 695000, 750000, 790000, 790000, 768000, 842000].slice(
        0,
        snapshot.count,
      ),
    ),
    make(
      "current-ratio",
      "Liquidität 3. Grades",
      c.currentAssets / c.currentLiabilities,
      "multiple",
      "Liquidität",
      { direction: "higher", good: 2, watch: 1 },
      "Mindestens 2,0×",
      "Deckung kurzfristiger Verbindlichkeiten durch das Umlaufvermögen.",
      "Umlaufvermögen / kurzfristige Verbindlichkeiten",
    ),
    make(
      "quick-ratio",
      "Liquidität 2. Grades",
      (c.cash + c.receivables) / c.currentLiabilities,
      "multiple",
      "Liquidität",
      { direction: "higher", good: 1, watch: 0.7 },
      "Mindestens 1,0×",
      "Kurzfristige Deckung ohne Vorräte.",
      "(Liquide Mittel + Forderungen) / kurzfristige Verbindlichkeiten",
    ),
    make(
      "dso",
      "Forderungslaufzeit",
      c.dso,
      "days",
      "Effizienz",
      { direction: "lower", good: 35, watch: 60 },
      "Höchstens 35 Tage",
      "Näherung auf Basis des Forderungsbestands am Stichtag. Alle Umsätze als Kreditumsätze angenommen.",
      "Forderungen / Monatsumsatz × Kalendertage",
      [52, 51, 50, 52, 50, 48, 47, 49, 46].slice(0, snapshot.count),
    ),
    make(
      "dio",
      "Lagerreichweite",
      c.dio,
      "days",
      "Effizienz",
      { direction: "lower", good: 45, watch: 60 },
      "Höchstens 45 Tage",
      "Rechnerische Reichweite der Vorräte; Stichtagsbestand als Näherung.",
      "Vorräte / Materialaufwand × Kalendertage",
      [55, 53, 54, 52, 50, 49, 50, 51, 48].slice(0, snapshot.count),
    ),
    make(
      "overdue",
      "Forderungen > 30 Tage",
      (c.overdue30 / c.receivables) * 100,
      "percent",
      "Risiko",
      { direction: "lower", good: 10, watch: 20 },
      "Höchstens 10 %",
      "Mehr als 30 Tage überfällige Posten im Verhältnis zu offenen Forderungen.",
      "Überfällig > 30 Tage / offene Forderungen × 100",
    ),
    make(
      "concentration",
      "Größter Kundenanteil",
      c.concentration,
      "percent",
      "Risiko",
      { direction: "lower", good: 20, watch: 40 },
      "Höchstens 20 %",
      "Umsatzanteil des größten Kunden im Demodatensatz.",
      "Umsatz größter Kunde / Gesamtumsatz × 100",
      [28, 29, 30, 31, 32, 31, 30, 32, 31].slice(0, snapshot.count),
    ),
    make(
      "leverage",
      "Net Debt / EBITDA",
      divide(c.debt - c.cash, (ytdEbitda / snapshot.count) * 12),
      "multiple",
      "Risiko",
      { direction: "lower", good: 2, watch: 4 },
      "Höchstens 2,0×",
      "Nettofinanzschulden relativ zum annualisierten YTD-EBITDA. Keine rollierenden 12 Monate.",
      "(Finanzschulden − Cash) / annualisiertes EBITDA",
    ),
    make(
      "revenue-fte",
      "Umsatz je FTE",
      null,
      "currency",
      "Effizienz",
      null,
      "Personaldaten erforderlich",
      "Personaldaten wurden bewusst nicht simuliert. Fehlende Werte werden nicht als Null dargestellt.",
      "Umsatz / durchschnittliche FTE",
    ),
  ];
}

export type Invoice = {
  id: string;
  customer: string;
  amount: number;
  dueDate: string;
  days: number;
  bucket: ReturnType<typeof agingBucket>;
};
export function getInvoices(period: string): Invoice[] {
  const snapshot = demoSnapshots.find((s) => s.id === period) ?? demoSnapshots[0];
  const c = getCapital(period);
  const base = [
    { customer: "Nordwerk Industrie", amount: 90000, age: 70 },
    { customer: "Alpen Energie", amount: 52000, age: 45 },
    { customer: "Rheinland Technik", amount: 30000, age: 35 },
    { customer: "Hanse Produktion", amount: 210000, age: 24 },
    { customer: "Mainwerk Services", amount: 160000, age: 15 },
    { customer: "Westfalen Anlagenbau", amount: 98000, age: 8 },
    { customer: "Nordwerk Industrie", amount: 400000, age: -8 },
    { customer: "Alpen Energie", amount: 330000, age: -15 },
    { customer: "Rheinland Technik", amount: 280000, age: -20 },
  ];
  const overdueScale = c.overdue30 / 172000;
  const restScale = (c.receivables - c.overdue30) / (1962666.67 - 172000);
  const rows = base.map((row, i) => {
    const amount = round(row.amount * (i < 3 ? overdueScale : restScale));
    const due = new Date(`${snapshot.end}T00:00:00Z`);
    due.setUTCDate(due.getUTCDate() - row.age);
    const dueDate = due.toISOString().slice(0, 10);
    const days = overdueDays(dueDate, snapshot.end);
    return {
      id: `RE-${period.slice(5)}-${String(i + 1).padStart(3, "0")}`,
      customer: row.customer,
      amount,
      dueDate,
      days,
      bucket: agingBucket(days),
    };
  });
  // Residual is assigned to a not-yet-due invoice so aging ties exactly to the snapshot.
  const due = new Date(`${snapshot.end}T00:00:00Z`);
  due.setUTCDate(due.getUTCDate() + 25);
  rows.push({
    id: `RE-${period.slice(5)}-010`,
    customer: "Südwerk Komponenten",
    amount: round(c.receivables - rows.reduce((sum, r) => sum + r.amount, 0)),
    dueDate: due.toISOString().slice(0, 10),
    days: 0,
    bucket: "current",
  });
  return rows;
}
export function getForecastMonths(period: string) {
  const months = [
    { month: "Sep", revenue: 1280000, variableCost: 691200, fixedCost: 378800 },
    { month: "Okt", revenue: 1320000, variableCost: 712800, fixedCost: 378000 },
    { month: "Nov", revenue: 1390000, variableCost: 750600, fixedCost: 380000 },
    { month: "Dez", revenue: 1480000, variableCost: 799200, fixedCost: 395000 },
  ];
  return period === "2026-08" ? months : months.slice(1);
}
export function getCashPlan(period: string) {
  return period === "2026-08"
    ? [
        { month: "Sep", receipts: 1310000, payments: 1236000 },
        { month: "Okt", receipts: 1350000, payments: 1270000 },
        { month: "Nov", receipts: 1370000, payments: 1430000 },
      ]
    : [
        { month: "Okt", receipts: 1350000, payments: 1270000 },
        { month: "Nov", receipts: 1370000, payments: 1430000 },
        { month: "Dez", receipts: 1490000, payments: 1350000 },
      ];
}
