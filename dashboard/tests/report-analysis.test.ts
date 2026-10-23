import test from "node:test";
import assert from "node:assert/strict";
import { buildReportAnalysis } from "../src/lib/report-analysis.ts";
import { buildReport } from "../src/lib/report.ts";
import { demoSnapshots } from "../src/lib/demo-data.ts";
import { round } from "../src/lib/finance.ts";

test("board report evidence reconciles plan contributions, YTD trend, ageing and cash", () => {
  for (const snapshot of demoSnapshots) {
    const a = buildReportAnalysis(snapshot);
    assert.equal(round(a.planEbitda + a.effects.reduce((s, r) => s + r.value, 0)), a.actualEbitda);
    assert.equal(round(a.effects.reduce((s, r) => s + r.value, 0)), a.ebitdaGap);
    assert.equal(round(a.trend.reduce((s, r) => s + r.revenue, 0)), a.ytd.revenue);
    assert.equal(round(a.trend.reduce((s, r) => s + r.ebitda, 0)), a.ytd.ebitda);
    assert.equal(a.trend.length, snapshot.count);
    assert.equal(round(a.aging.reduce((s, r) => s + r.value, 0)), a.capital.receivables);
    assert.equal(round(a.aging.slice(2).reduce((s, r) => s + r.value, 0)), a.capital.overdue30);
    assert.equal(a.cash.closingCash, a.capital.cash);
    assert.equal(round(a.cash.operating + a.cash.investing), a.cash.freeCashflow);
    assert.equal(
      round(a.balance.totals.noncurrentAssets + a.balance.totals.currentAssets),
      round(a.balance.totals.assets),
    );
    assert.equal(
      round(
        a.balance.totals.equity +
          a.balance.totals.longLiabilities +
          a.balance.totals.currentLiabilities,
      ),
      round(a.balance.totals.assets),
    );
    assert.equal(a.forecast[0].opening, a.cash.closingCash);
    assert.equal(a.lowest.closing, Math.min(...a.forecast.map((m) => m.closing)));
  }
});
test("September board evidence distinguishes favorable revenue from unfavorable cost contributions", () => {
  const a = buildReportAnalysis(demoSnapshots.find((s) => s.id === "2026-09")!);
  assert.deepEqual(
    a.effects.map((e) => e.value),
    [80000, -44000, 0, -6000],
  );
  assert.equal(a.ebitdaGap, 30000);
  assert.equal(a.minimumHeadroom, 362000);
  assert.equal(a.dso.gap, 11);
});
test("session targets change board interpretations without mutating ledger or forecast", () => {
  const snapshot = demoSnapshots[0];
  const baseline = buildReportAnalysis(snapshot);
  const custom = buildReportAnalysis(snapshot, {
    cash: { direction: "higher", good: 1500000, watch: 1400000 },
    dso: { direction: "lower", good: 60, watch: 80 },
  });
  assert.deepEqual(custom.forecast, baseline.forecast);
  assert.deepEqual(custom.cash, baseline.cash);
  assert.deepEqual(custom.effects, baseline.effects);
  assert.ok(custom.minimumHeadroom < 0);
  assert.ok(custom.dso.gap! < 0);
  assert.equal(custom.dso.target, 60);
});
test("report evidence exports follow selected period and optional risk sections", () => {
  const snapshot = demoSnapshots[0];
  const full = buildReport(snapshot, {
    notes: "Eigene Notiz",
    full: true,
    includeRisks: true,
    includeCash: true,
  });
  const flash = buildReport(snapshot, {
    notes: "",
    full: false,
    includeRisks: false,
    includeCash: false,
  });
  assert.match(full.markdown, /Ergebnisbeiträge gegenüber Plan/);
  assert.match(full.markdown, /Forderungsalter/);
  assert.match(full.markdown, /Eigene Notiz/);
  assert.doesNotMatch(
    flash.markdown,
    /Ergebnisbeiträge gegenüber Plan|Forderungsalter|## Liquiditätsvorschau/,
  );
});
