import { revenueHistory } from "./demo-data.ts";
import { getBalanceSeed } from "./demo-ledger.ts";
import { divide, variance } from "./finance.ts";

/** Monthly flows and closing cash share the existing fictional 2026 ledger. */
export function getOverviewChartPoints() {
  return revenueHistory.map((point, index) => {
    const period = `2026-${String(index + 1).padStart(2, "0")}`;
    const comparison = variance(point.revenue, point.budget);
    const ratio = divide(point.ebitda, point.revenue);
    return {
      ...point,
      period,
      cash: getBalanceSeed(period).cash,
      margin: ratio === null ? null : ratio * 100,
      variance: comparison.absolute,
      planMet: comparison.absolute >= 0,
      variancePercent: comparison.percent,
    };
  });
}
export type OverviewChartPoint = ReturnType<typeof getOverviewChartPoints>[number];
