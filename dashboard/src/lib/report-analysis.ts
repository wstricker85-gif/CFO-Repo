import type { DemoSnapshot } from "./demo-data.ts";
import { revenueHistory } from "./demo-data.ts";
import { getPnl, getCapital, getInvoices, getKpis, getCashPlan } from "./demo-company.ts";
import { getBalanceStatement, getCashflowStatement, getIncomeStatement } from "./statements.ts";
import { cashForecast, divide, round } from "./finance.ts";
import type { DemoRules } from "./demo-policy.ts";

/** Numeric evidence for the board pack. Never infer causes or promised cash releases. */
export function buildReportAnalysis(snapshot: DemoSnapshot, rules: DemoRules = {}) {
  const pnl = getPnl(snapshot.id),
    ytd = getPnl(snapshot.id, true);
  const capital = getCapital(snapshot.id),
    balance = getBalanceStatement(snapshot.id);
  const cash = getCashflowStatement(snapshot.id),
    income = getIncomeStatement(snapshot.id);
  const definitions = getKpis(snapshot.id, rules);
  const cashFloor = definitions.find((d) => d.metric.id === "cash")!.rule!.good;
  const dso = definitions.find((d) => d.metric.id === "dso")!;
  const effects = [
    { label: "Umsatzbeitrag", value: pnl[0].variance },
    { label: "Materialeffekt", value: -pnl[1].variance || 0 },
    { label: "Personaleffekt", value: -pnl[3].variance || 0 },
    { label: "Sonstiger Kosteneffekt", value: -pnl[4].variance || 0 },
  ];
  const invoices = getInvoices(snapshot.id);
  const trend = revenueHistory.slice(0, snapshot.count).map((m, i) => ({
    ...m,
    margin: divide(m.ebitda * 100, m.revenue),
    // The YTD plan uses exactly the same underlying monthly plan as the statements.
    index: i,
  }));
  const aging = (["current", "1-30", "31-60", "61+"] as const).map((bucket) => ({
    label: {
      current: "Noch nicht fällig",
      "1-30": "1–30 Tage überfällig",
      "31-60": "31–60 Tage überfällig",
      "61+": "Über 60 Tage überfällig",
    }[bucket],
    value: round(invoices.filter((i) => i.bucket === bucket).reduce((s, i) => s + i.amount, 0)),
  }));
  const forecast = cashForecast(capital.cash, getCashPlan(snapshot.id));
  const lowest = forecast.reduce((a, b) => (a.closing <= b.closing ? a : b));
  return {
    trend,
    effects,
    aging,
    cash,
    income,
    balance,
    forecast,
    cashFloor,
    lowest,
    minimumHeadroom: round(lowest.closing - cashFloor),
    margin: divide(pnl[5].actual * 100, pnl[0].actual),
    plannedMargin: divide(pnl[5].budget * 100, pnl[0].budget),
    ebitdaGap: pnl[5].variance,
    planEbitda: pnl[5].budget,
    actualEbitda: pnl[5].actual,
    ytd: {
      revenue: ytd[0].actual,
      revenuePlan: ytd[0].budget,
      revenueGap: ytd[0].variance,
      ebitda: ytd[5].actual,
      ebitdaPlan: ytd[5].budget,
      ebitdaGap: ytd[5].variance,
    },
    dso: {
      value: dso.metric.value,
      target: dso.rule!.good,
      gap: dso.metric.value === null ? null : round(dso.metric.value - dso.rule!.good, 1),
    },
    capital,
    pnl,
  };
}
export type ReportAnalysis = ReturnType<typeof buildReportAnalysis>;
