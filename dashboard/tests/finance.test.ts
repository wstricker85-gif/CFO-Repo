import test from "node:test";
import assert from "node:assert/strict";
import {
  agingBucket,
  calculateDcf,
  cashForecast,
  classify,
  divide,
  forecastScenario,
  overdueDays,
  variance,
} from "../src/lib/finance.ts";
import {
  getCapital,
  getInvoices,
  getKpis,
  getPnl,
  getForecastMonths,
} from "../src/lib/demo-company.ts";
import { demoSnapshots } from "../src/lib/demo-data.ts";
import { metricSchema } from "../src/lib/contracts.ts";
import { convertCurrency, getDemoMarket } from "../src/lib/demo-market.ts";
import { buildReport } from "../src/lib/report.ts";
import { csvContent } from "../src/lib/export.ts";
const close = (actual: number, expected: number, tolerance = 0.011) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test("zero denominator is unavailable, a real zero remains valid", () => {
  assert.equal(divide(10, 0), null);
  assert.equal(divide(0, 10), 0);
  assert.equal(divide(Infinity, 10), null);
  assert.equal(divide(1e308, 1e-308), null);
});
test("cost and revenue variances have different business meaning", () => {
  assert.equal(variance(110, 100).assessment, "improving");
  assert.equal(variance(110, 100, true).assessment, "deteriorating");
  assert.equal(variance(90, 100, true).assessment, "improving");
  assert.equal(variance(0, 0).percent, null);
  assert.equal(variance(0, 0).assessment, "stable");
});
test("threshold boundaries are inclusive and missing values cannot be green", () => {
  const lower = { direction: "lower" as const, good: 35, watch: 60 };
  assert.equal(classify(35, lower), "good");
  assert.equal(classify(60, lower), "watch");
  assert.equal(classify(61, lower), "warning");
  assert.equal(classify(null, lower), "unavailable");
  assert.equal(classify(NaN, lower), "unavailable");
  assert.equal(classify(15, { direction: "higher", good: 15, watch: 10 }), "good");
  assert.equal(classify(10, { direction: "higher", good: 15, watch: 10 }), "watch");
});
test("aging buckets have no gaps at 30 and 60 days, dates use UTC", () => {
  assert.equal(overdueDays("2026-09-30", "2026-09-30"), 0);
  assert.equal(overdueDays("2026-10-02", "2026-09-30"), 0);
  assert.equal(overdueDays("2026-08-31", "2026-09-30"), 30);
  for (const [days, expected] of [
    [0, "current"],
    [1, "1-30"],
    [30, "1-30"],
    [31, "31-60"],
    [60, "31-60"],
    [61, "61+"],
  ] as const)
    assert.equal(agingBucket(days), expected);
});
const dcf = {
  revenue: 1000,
  margin: 20,
  growth: 0,
  taxRate: 0,
  depreciation: 0,
  capex: 0,
  workingCapitalInvestment: 0,
  wacc: 10,
  terminalGrowth: 0,
  netDebt: 100,
};
test("constant cashflow DCF equals known perpetuity value", () => {
  const result = calculateDcf(dcf);
  assert.equal(result.years.length, 5);
  assert.equal(result.years[0].fcf, 200);
  close(result.enterpriseValue, 2000);
  close(result.equityValue, 1900);
  close(
    result.years.reduce((s, y) => s + y.presentValue, 0) + result.terminalPresentValue,
    result.enterpriseValue,
  );
});
test("valuation responds to drivers, rejects invalid terminal assumptions", () => {
  const base = calculateDcf(dcf).enterpriseValue;
  assert.ok(calculateDcf({ ...dcf, wacc: 12 }).enterpriseValue < base);
  assert.ok(calculateDcf({ ...dcf, growth: 5 }).enterpriseValue > base);
  assert.ok(calculateDcf({ ...dcf, capex: 50 }).enterpriseValue < base);
  assert.throws(() => calculateDcf({ ...dcf, terminalGrowth: 10 }));
  assert.throws(() => calculateDcf({ ...dcf, wacc: 0 }));
  assert.throws(() => calculateDcf({ ...dcf, taxRate: 101 }));
  assert.throws(() => calculateDcf({ ...dcf, capex: NaN }));
  assert.throws(() => calculateDcf({ ...dcf, revenue: 0 }));
});
test("forecast scenarios scale variable costs, leave original actuals/inputs untouched", () => {
  const months = [{ month: "Okt", revenue: 1000, variableCost: 500, fixedCost: 200 }];
  const result = forecastScenario(months, -10, 5)[0];
  assert.equal(result.revenue, 900);
  assert.equal(result.variableCost, 450);
  assert.equal(result.fixedCost, 210);
  assert.equal(result.ebitda, 240);
  assert.equal(months[0].revenue, 1000);
});
test("cash forecast reconciles each month and permits a visible funding gap", () => {
  const result = cashForecast(100, [
    { month: "A", receipts: 50, payments: 100 },
    { month: "B", receipts: 10, payments: 90 },
  ]);
  assert.equal(result[0].closing, 50);
  assert.equal(result[1].opening, 50);
  assert.equal(result[1].closing, -30);
  for (const m of result) close(m.opening + m.receipts - m.payments, m.closing);
});
test("all demo modules tie to the selected snapshot and complete ledger", () => {
  for (const snapshot of demoSnapshots) {
    const capital = getCapital(snapshot.id),
      invoices = getInvoices(snapshot.id);
    close(
      invoices.reduce((s, i) => s + i.amount, 0),
      capital.receivables,
    );
    close(
      invoices.filter((i) => i.days > 30).reduce((s, i) => s + i.amount, 0),
      capital.overdue30,
    );
    assert.ok(invoices.every((i) => i.amount > 0));
    assert.equal(new Set(invoices.map((i) => i.id)).size, invoices.length);
    close((capital.receivables / snapshot.rows[0].actual) * capital.days, capital.dso);
    close((capital.inventory / snapshot.rows[1].actual) * capital.days, capital.dio);
    close((capital.payables / snapshot.rows[1].actual) * capital.days, capital.dpo);
    const ytd = getPnl(snapshot.id, true);
    close(ytd[0].actual - ytd[1].actual, ytd[2].actual);
    close(ytd[2].actual - ytd[3].actual - ytd[4].actual, ytd[5].actual);
    close(ytd[0].budget - ytd[1].budget, ytd[2].budget);
    close(ytd[2].budget - ytd[3].budget - ytd[4].budget, ytd[5].budget);
    assert.equal(getForecastMonths(snapshot.id).length + snapshot.count, 12);
    const kpis = getKpis(snapshot.id);
    assert.equal(kpis.length, 12);
    for (const { metric } of kpis)
      assert.equal(metricSchema.safeParse(metric).success, true, metric.id);
    assert.equal(kpis.find((k) => k.metric.id === "revenue-fte")?.metric.status, "unavailable");
  }
});
test("fictional FX conversion is reversible and uses explicit assumptions", () => {
  const market = getDemoMarket("2026-09");
  close(convertCurrency(100, "EUR", "USD", market.rates), 110);
  close(convertCurrency(110, "USD", "EUR", market.rates), 100);
  close(convertCurrency(100, "USD", "CHF", market.rates), (100 / 1.1) * 0.94);
  assert.throws(() => convertCurrency(-1, "EUR", "USD", market.rates));
});
test("report preserves selected period, missing-data caveats and user notes", () => {
  for (const snapshot of demoSnapshots) {
    const report = buildReport(snapshot, {
      full: true,
      includeCash: true,
      includeRisks: true,
      notes: "Eigener Beschlussvorschlag",
    });
    assert.ok(report.markdown.includes(snapshot.label));
    assert.ok(report.markdown.includes("fiktive Daten"));
    assert.ok(report.markdown.includes("FTE-Daten fehlen"));
    assert.ok(report.markdown.includes("Eigener Beschlussvorschlag"));
    const short = buildReport(snapshot, {
      full: false,
      includeCash: false,
      includeRisks: false,
      notes: "",
    });
    assert.ok(!short.markdown.includes("## CFO-Kommentar"));
    assert.ok(!short.markdown.includes("## Liquiditätsvorschau"));
  }
});
test("CSV export quotes delimiters, uses German decimals and blocks formula strings", () => {
  const csv = csvContent([['=HYPERLINK("x")', "Kunde; Test", 12.5, -10, null]]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"\'=HYPERLINK(""x"")"'));
  assert.ok(csv.includes('"12,5"'));
  assert.ok(csv.includes('"-10"'));
  assert.ok(csv.includes('"Kunde; Test"'));
});

test("invalid scenario and payment inputs never become financial outputs", () => {
  assert.throws(() =>
    forecastScenario([{ month: "Okt", revenue: 100, variableCost: 50, fixedCost: 20 }], -101, 0),
  );
  assert.throws(() =>
    forecastScenario([{ month: "Okt", revenue: NaN, variableCost: 50, fixedCost: 20 }], 0, 0),
  );
  assert.throws(() => cashForecast(100, [{ month: "Okt", receipts: Infinity, payments: 0 }]));
  assert.throws(() => variance(NaN, 100));
  assert.throws(() => calculateDcf({ ...dcf, revenue: 1e308, growth: 100 }));
  assert.throws(() =>
    convertCurrency(100, "EUR", "USD", { EUR: 1, USD: Infinity, CHF: 0.94, GBP: 0.84, PLN: 4.28 }),
  );
});
