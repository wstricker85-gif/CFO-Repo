import test from "node:test";
import assert from "node:assert/strict";
import { getOverviewChartPoints } from "../src/lib/overview-chart.ts";
import { getBalanceSeed } from "../src/lib/demo-ledger.ts";

test("Overview timeline reconciles monthly performance and closing cash to the demo ledger", () => {
  const points = getOverviewChartPoints();
  assert.equal(points.length, 9);
  assert.equal(points[0].period, "2026-01");
  for (const point of points) {
    assert.equal(point.cash, getBalanceSeed(point.period).cash);
    assert.equal(point.margin, (point.ebitda / point.revenue) * 100);
    assert.equal(point.variance, point.revenue - point.budget);
  }
  assert.equal(points[0].planMet, false);
  assert.equal(points[1].planMet, true);
  const september = points.at(-1)!;
  assert.equal(september.period, "2026-09");
  assert.equal(september.planMet, true);
  assert.equal(september.revenue, 1280000);
  assert.equal(september.budget, 1200000);
  assert.equal(september.ebitda, 210000);
  assert.equal(september.margin, 16.40625);
  assert.equal(september.cash, 842000);
  assert.equal(september.variancePercent, 6.7);
});
