import test from "node:test";
import assert from "node:assert/strict";
import { agentResultSchema, metricSchema } from "../src/lib/contracts.ts";
import { formatDelta, formatValue } from "../src/lib/format.ts";

const meta = {
  schema_version: "1.0",
  request_id: "test-request",
  company_id: "test-company",
  period: { start: "2026-09-01", end: "2026-09-30" },
  currency: "EUR",
  data_cutoff: "2026-09-30T18:00:00Z",
  generated_at: "2026-10-01T08:00:00Z",
  sources: [
    {
      id: "engine-1",
      label: "Validated engine result",
      kind: "engine",
      as_of: "2026-09-30T18:00:00Z",
    },
  ],
  assumptions: [],
  warnings: [],
};
const dso = {
  id: "dso",
  label: "Forderungslaufzeit",
  value: 65,
  unit: "days",
  status: "critical",
  comparison: {
    label: "zum Vormonat",
    value: -3,
    unit: "days",
    direction: "down",
    assessment: "improving",
  },
  target: "Höchstens 35 Tage",
  unavailable_reason: null,
  evidence_ids: ["engine-1"],
};
const alert = {
  id: "dso-alert",
  metric_id: "dso",
  priority: "critical",
  title: "DSO über Ziel",
  message: "Kapitalbindung bleibt hoch",
  suggested_action: "Offene Posten abstimmen",
  evidence_ids: ["engine-1"],
};
const kpi = {
  ...meta,
  agent: "kpi-monitor",
  metrics: [dso],
  alerts: [alert],
  summary: "Forderungen bleiben kritisch, verbessern sich aber.",
};
const plan = {
  ...meta,
  agent: "orchestrator",
  intent: "Board update",
  output_format: "report",
  missing_inputs: [],
  steps: [
    { id: "kpis", agent: "kpi-monitor", depends_on: [], input_refs: ["engine-1"] },
    { id: "report", agent: "board-report", depends_on: ["kpis"], input_refs: ["kpis"] },
  ],
};

test("critical status and improving trend remain independent", () => {
  const result = agentResultSchema.parse(kpi);
  assert.equal(result.agent, "kpi-monitor");
  if (result.agent === "kpi-monitor")
    assert.equal(result.metrics[0].comparison?.assessment, "improving");
});
test("missing is distinct from a valid zero", () => {
  assert.equal(metricSchema.safeParse({ ...dso, value: 0, comparison: null }).success, true);
  assert.equal(metricSchema.safeParse({ ...dso, value: null }).success, false);
  assert.equal(
    metricSchema.safeParse({
      ...dso,
      value: null,
      status: "unavailable",
      unavailable_reason: "No comparable sales data",
      comparison: null,
    }).success,
    true,
  );
  assert.equal(
    metricSchema.safeParse({
      ...dso,
      value: 0,
      status: "unavailable",
      unavailable_reason: "Missing",
    }).success,
    false,
  );
});
test("invalid values, misleading direction and unknown fields are rejected", () => {
  for (const value of [NaN, Infinity, -Infinity])
    assert.equal(metricSchema.safeParse({ ...dso, value }).success, false);
  assert.equal(
    metricSchema.safeParse({ ...dso, comparison: { ...dso.comparison, direction: "up" } }).success,
    false,
  );
  assert.equal(agentResultSchema.safeParse({ ...kpi, invented: true }).success, false);
});
test("alerts and evidence must resolve, red metrics need alerts", () => {
  assert.equal(agentResultSchema.safeParse({ ...kpi, alerts: [] }).success, false);
  assert.equal(
    agentResultSchema.safeParse({ ...kpi, metrics: [{ ...dso, evidence_ids: ["unknown"] }] })
      .success,
    false,
  );
  assert.equal(
    agentResultSchema.safeParse({ ...kpi, alerts: [{ ...alert, metric_id: "unknown" }] }).success,
    false,
  );
  assert.equal(
    agentResultSchema.safeParse({ ...kpi, alerts: [{ ...alert, evidence_ids: ["unknown"] }] })
      .success,
    false,
  );
});
test("plans reject cycles, duplicate IDs and early reports", () => {
  assert.equal(agentResultSchema.safeParse(plan).success, true);
  assert.equal(
    agentResultSchema.safeParse({ ...plan, steps: [...plan.steps].reverse() }).success,
    false,
  );
  assert.equal(
    agentResultSchema.safeParse({ ...plan, steps: [plan.steps[0], plan.steps[0]] }).success,
    false,
  );
  assert.equal(
    agentResultSchema.safeParse({ ...plan, steps: [{ ...plan.steps[0], depends_on: ["kpis"] }] })
      .success,
    false,
  );
  assert.equal(agentResultSchema.safeParse({ ...plan, missing_inputs: ["P&L"] }).success, false);
});
test("market-only plan works without an upload", () => {
  assert.equal(
    agentResultSchema.safeParse({
      ...plan,
      sources: [],
      output_format: "json",
      steps: [{ id: "market", agent: "market-data", depends_on: [], input_refs: ["user-query"] }],
    }).success,
    true,
  );
});
test("valuations require rectangular sensitivity tables", () => {
  const result = {
    ...meta,
    agent: "financial-analyst",
    analysis_type: "dcf",
    metrics: [],
    findings: [],
    recommendations: [],
    sensitivity: null,
  };
  assert.equal(agentResultSchema.safeParse(result).success, false);
  const sensitivity = {
    row_driver: "growth",
    column_driver: "wacc",
    row_values: [1, 2],
    column_values: [8, 9],
    values: [
      [100, 90],
      [110, 100],
    ],
  };
  assert.equal(agentResultSchema.safeParse({ ...result, sensitivity }).success, true);
  assert.equal(
    agentResultSchema.safeParse({ ...result, sensitivity: { ...sensitivity, values: [[100]] } })
      .success,
    false,
  );
});
test("all remaining agent branches validate explicit payloads", () => {
  assert.equal(
    agentResultSchema.safeParse({
      ...meta,
      agent: "budget-planner",
      forecast_date: "2026-10-01",
      report_type: "variance",
      metrics: [],
      findings: [],
      scenarios: [],
    }).success,
    true,
  );
  assert.equal(
    agentResultSchema.safeParse({
      ...meta,
      agent: "board-report",
      format: "executive_flash",
      headline: "Performance",
      markdown: "## Performance",
      upstream_request_ids: ["validated-upstream"],
    }).success,
    true,
  );
  const observation = {
    symbol: "TEST",
    metric: dso,
    provider: "test",
    as_of: meta.data_cutoff,
    fetched_at: meta.generated_at,
    cache_age_minutes: 61,
    ttl_minutes: 60,
    stale: true,
    peers: [],
  };
  assert.equal(
    agentResultSchema.safeParse({
      ...meta,
      agent: "market-data",
      observations: [observation],
      warnings: ["Stale data"],
    }).success,
    true,
  );
  assert.equal(
    agentResultSchema.safeParse({
      ...meta,
      agent: "market-data",
      observations: [{ ...observation, stale: false }],
    }).success,
    false,
  );
});
test("periods and German financial units are unambiguous", () => {
  assert.equal(
    agentResultSchema.safeParse({ ...kpi, period: { start: "2026-10-01", end: "2026-09-01" } })
      .success,
    false,
  );
  assert.equal(formatValue(14.3, "percent"), "14,3 %");
  assert.equal(formatDelta(1.2, "percentage_points"), "+1,2 PP");
  assert.equal(formatValue(null, "currency"), "Nicht verfügbar");
});

test("demo periods reconcile P&L, cards and chart values", async () => {
  const { demoSnapshots, revenueHistory } = await import("../src/lib/demo-data.ts");
  assert.equal(demoSnapshots.length, 2);
  for (const snapshot of demoSnapshots) {
    assert.equal(agentResultSchema.safeParse(snapshot.result).success, true);
    for (const row of snapshot.rows) {
      assert.equal(row.actual - row.budget, row.variance, row.label);
      if (row.variancePercent !== null && row.budget !== 0) {
        assert.ok(
          Math.abs((row.variance / row.budget) * 100 - row.variancePercent) < 0.051,
          row.label,
        );
      }
    }
    const byLabel = (label: string) => snapshot.rows.find((row) => row.label === label)!;
    const revenue = byLabel("Umsatzerlöse");
    const gross = byLabel("Rohertrag");
    const ebitda = byLabel("EBITDA");
    for (const scenario of ["actual", "budget"] as const) {
      assert.equal(
        revenue[scenario] - byLabel("Material & Fremdleistungen")[scenario],
        gross[scenario],
      );
      assert.equal(
        gross[scenario] -
          byLabel("Personalaufwand")[scenario] -
          byLabel("Sonstiger Betriebsaufwand")[scenario],
        ebitda[scenario],
      );
    }
    assert.equal(snapshot.result.metrics.find((m) => m.id === "revenue")?.value, revenue.actual);
    const margin = snapshot.result.metrics.find((m) => m.id === "ebitda-margin")!.value!;
    assert.ok(Math.abs((ebitda.actual / revenue.actual) * 100 - margin) < 0.051);
    const point = revenueHistory[snapshot.count - 1];
    assert.equal(point.revenue, revenue.actual);
    assert.equal(point.budget, revenue.budget);
    assert.equal(point.ebitda, ebitda.actual);
  }
});
