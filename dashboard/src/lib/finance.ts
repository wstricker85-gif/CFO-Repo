/** Deterministic demo calculations. No model calls and no external data.
 * Production calculations will move behind the Python engine contract.
 */
export function divide(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0)
    return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}
export const round = (value: number, decimals = 2) =>
  Math.round((value + Number.EPSILON) * 10 ** decimals) / 10 ** decimals;
export function variance(actual: number, budget: number, cost = false) {
  if (![actual, budget].every(Number.isFinite))
    throw new Error("Ist und Plan müssen endliche Zahlen sein.");
  const absolute = round(actual - budget);
  const percent = budget === 0 ? null : round((absolute / Math.abs(budget)) * 100, 1);
  const favorable = cost ? absolute < 0 : absolute > 0;
  return {
    absolute,
    percent,
    assessment:
      absolute === 0
        ? ("stable" as const)
        : favorable
          ? ("improving" as const)
          : ("deteriorating" as const),
  };
}
export type Threshold = { direction: "higher" | "lower"; good: number; watch: number };
export function classify(
  value: number | null,
  rule: Threshold,
): "good" | "watch" | "warning" | "unavailable" {
  if (value === null || !Number.isFinite(value)) return "unavailable";
  if (rule.direction === "higher")
    return value >= rule.good ? "good" : value >= rule.watch ? "watch" : "warning";
  return value <= rule.good ? "good" : value <= rule.watch ? "watch" : "warning";
}
export function overdueDays(dueDate: string, asOf: string): number {
  return Math.max(
    0,
    Math.floor((Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${dueDate}T00:00:00Z`)) / 86400000),
  );
}
export function agingBucket(days: number): "current" | "1-30" | "31-60" | "61+" {
  return days === 0 ? "current" : days <= 30 ? "1-30" : days <= 60 ? "31-60" : "61+";
}
export type DcfInputs = {
  revenue: number;
  margin: number;
  growth: number;
  taxRate: number;
  depreciation: number;
  capex: number;
  workingCapitalInvestment: number;
  wacc: number;
  terminalGrowth: number;
  netDebt: number;
};
export function calculateDcf(inputs: DcfInputs) {
  const {
    revenue,
    margin,
    growth,
    taxRate,
    depreciation,
    capex,
    workingCapitalInvestment,
    wacc,
    terminalGrowth,
    netDebt,
  } = inputs;
  if (Object.values(inputs).some((v) => !Number.isFinite(v)))
    throw new Error("Alle Annahmen müssen endliche Zahlen sein.");
  if (wacc <= terminalGrowth || wacc <= 0)
    throw new Error("Der WACC muss positiv und größer als das ewige Wachstum sein.");
  if (
    revenue <= 0 ||
    margin < 0 ||
    margin > 100 ||
    taxRate < 0 ||
    taxRate > 100 ||
    growth <= -100 ||
    terminalGrowth <= -100 ||
    [depreciation, capex, workingCapitalInvestment].some((v) => v < 0)
  )
    throw new Error("Die Modellannahmen liegen außerhalb des gültigen Bereichs.");
  const years = Array.from({ length: 5 }, (_, i) => {
    const year = i + 1;
    const sales = revenue * (1 + growth / 100) ** year;
    const scale = sales / revenue;
    const ebitda = (sales * margin) / 100;
    const da = depreciation * scale;
    const ebit = ebitda - da;
    const tax = (Math.max(0, ebit) * taxRate) / 100;
    const fcf = ebit - tax + da - capex * scale - workingCapitalInvestment * scale;
    return {
      year,
      revenue: sales,
      ebitda,
      depreciation: da,
      tax,
      capex: capex * scale,
      workingCapital: workingCapitalInvestment * scale,
      fcf,
      presentValue: fcf / (1 + wacc / 100) ** year,
    };
  });
  const terminalValue =
    (years[4].fcf * (1 + terminalGrowth / 100)) / ((wacc - terminalGrowth) / 100);
  const terminalPresentValue = terminalValue / (1 + wacc / 100) ** 5;
  const enterpriseValue =
    years.reduce((sum, year) => sum + year.presentValue, 0) + terminalPresentValue;
  if (
    ![
      terminalValue,
      terminalPresentValue,
      enterpriseValue,
      ...years.flatMap((y) => Object.values(y)),
    ].every(Number.isFinite)
  )
    throw new Error("Die Modellannahmen führen zu einem Zahlenüberlauf.");
  return {
    years,
    terminalValue,
    terminalPresentValue,
    enterpriseValue,
    equityValue: enterpriseValue - netDebt,
    terminalShare: divide(terminalPresentValue * 100, enterpriseValue),
  };
}
export type ForecastMonth = {
  month: string;
  revenue: number;
  variableCost: number;
  fixedCost: number;
};
export function forecastScenario(
  months: ForecastMonth[],
  revenueChange: number,
  fixedCostChange: number,
) {
  if (
    ![revenueChange, fixedCostChange].every(Number.isFinite) ||
    revenueChange < -100 ||
    fixedCostChange < -100 ||
    months.some((m) =>
      [m.revenue, m.variableCost, m.fixedCost].some((v) => !Number.isFinite(v) || v < 0),
    )
  )
    throw new Error("Ungültige Forecast-Annahmen.");
  return months.map((m) => {
    const revenue = round(m.revenue * (1 + revenueChange / 100));
    const variableCost = round(m.variableCost * (1 + revenueChange / 100));
    const fixedCost = round(m.fixedCost * (1 + fixedCostChange / 100));
    return {
      ...m,
      revenue,
      variableCost,
      fixedCost,
      ebitda: round(revenue - variableCost - fixedCost),
    };
  });
}
export function cashForecast(
  opening: number,
  months: { month: string; receipts: number; payments: number }[],
) {
  if (
    !Number.isFinite(opening) ||
    months.some((m) => [m.receipts, m.payments].some((v) => !Number.isFinite(v) || v < 0))
  )
    throw new Error("Ungültige Zahlungsannahmen.");
  let balance = opening;
  return months.map((m) => {
    const start = balance;
    const net = round(m.receipts - m.payments);
    balance = round(start + net);
    return { ...m, opening: start, net, closing: balance };
  });
}
