import { agentResultSchema } from "../src/lib/contracts.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { demoSnapshots } from "../src/lib/demo-data.ts";
import { getKpis } from "../src/lib/demo-company.ts";
import { applyDemoRules, validateRules, type DemoRules } from "../src/lib/demo-policy.ts";
import { buildReport } from "../src/lib/report.ts";
import { getCashflowStatement, getBalanceStatement } from "../src/lib/statements.ts";
const rules: DemoRules = {
  dso: { direction: "lower", good: 50, watch: 60 },
  cash: { direction: "higher", good: 900000, watch: 700000 },
  "ebitda-margin": { direction: "higher", good: 20, watch: 18 },
};
test("session targets change classification and report interpretation without rewriting booked facts", () => {
  const source = demoSnapshots.find((s) => s.id === "2026-09")!;
  const before = structuredClone(source);
  const cash = getCashflowStatement(source.id),
    balance = getBalanceStatement(source.id);
  const snapshot = applyDemoRules(source, validateRules(rules));
  assert.equal(agentResultSchema.safeParse(snapshot.result).success, true);
  const definitions = getKpis(source.id, rules);
  for (const metric of snapshot.result.metrics) {
    assert.equal(metric.status, definitions.find((d) => d.metric.id === metric.id)!.metric.status);
    assert.equal(metric.value, source.result.metrics.find((m) => m.id === metric.id)!.value);
  }
  assert.equal(snapshot.result.metrics.find((m) => m.id === "dso")!.status, "good");
  assert.equal(snapshot.result.metrics.find((m) => m.id === "cash")!.status, "watch");
  assert.equal(snapshot.result.metrics.find((m) => m.id === "ebitda-margin")!.status, "warning");
  assert.deepEqual(snapshot.rows, source.rows);
  assert.deepEqual(source, before);
  assert.deepEqual(getCashflowStatement(source.id), cash);
  assert.deepEqual(getBalanceStatement(source.id), balance);
  const report = buildReport(snapshot, {
    notes: "",
    includeCash: true,
    includeRisks: true,
    full: true,
    rules,
  });
  assert.match(report.paragraphs[2], /4 Tage unterhalb/);
  assert.doesNotMatch(report.paragraphs[2], /11 Tage über/);
  assert.match(report.markdown, /Ziel Forderungslaufzeit: ≤ 50 Tage/);
  assert.equal(applyDemoRules(source, {}), source);
});
test("targets apply across months while comparisons and unavailable values remain intact", () => {
  for (const source of demoSnapshots) {
    const result = applyDemoRules(source, rules);
    assert.deepEqual(
      result.result.metrics.find((m) => m.id === "dso")!.comparison,
      source.result.metrics.find((m) => m.id === "dso")!.comparison,
    );
    assert.equal(
      getKpis(source.id, rules).find((d) => d.metric.id === "revenue-fte")!.metric.value,
      null,
    );
  }
});
test("invalid thresholds are rejected rather than producing misleading signals", () => {
  const invalid: DemoRules[] = [
    { dso: { direction: "higher", good: 50, watch: 30 } },
    { dso: { direction: "lower", good: 60, watch: 50 } },
    { cash: { direction: "higher", good: NaN, watch: 3 } },
    { cash: { direction: "higher", good: -1, watch: -2 } },
    { unknown: { direction: "lower", good: 1, watch: 2 } },
  ];
  for (const bad of invalid) assert.throws(() => validateRules(bad));
});
