import test from "node:test";
import assert from "node:assert/strict";
import { getKpis } from "../src/lib/demo-company.ts";
import { metricInsight, summaryInsight } from "../src/lib/insights.ts";
import { classify } from "../src/lib/finance.ts";

function insightFor(id: string, period = "2026-09") {
  const definition = getKpis(period).find((d) => d.metric.id === id)!;
  return metricInsight(definition.metric, {
    period,
    description: definition.description,
    formula: definition.formula,
    rule: definition.rule,
  });
}
test("DSO explanation preserves both target gap and favorable downward trend", () => {
  const result = insightFor("dso");
  assert.ok(result.analysis.includes("11 Tage oberhalb"));
  assert.ok(result.analysis.includes("−3 Tage"));
  assert.ok(result.analysis.includes("Verbesserung"));
  assert.ok(result.caveat?.includes("Stichtagsbestand"));
});
test("changing period changes the explanation without inventing causes", () => {
  const august = insightFor("dso", "2026-08");
  assert.ok(august.analysis.includes("14 Tage oberhalb"));
  assert.ok(august.analysis.includes("Verschlechterung"));
  assert.ok(august.sourceLabel.includes("2026-08"));
  assert.ok(!august.analysis.includes("11 Tage"));
});
test("margin target gaps use percentage points, not relative percentages", () => {
  const result = insightFor("ebitda-margin");
  assert.ok(result.analysis.includes("1,4 PP"));
  assert.ok(!result.analysis.includes("1,4 %"));
});
test("custom KPI targets are reflected in the tooltip", () => {
  const definition = getKpis("2026-09").find((d) => d.metric.id === "dso")!;
  const rule = { direction: "lower" as const, good: 50, watch: 60 };
  const metric = { ...definition.metric, status: classify(definition.metric.value, rule) };
  const result = metricInsight(metric, {
    period: "September 2026",
    description: definition.description,
    formula: definition.formula,
    rule,
  });
  assert.ok(result.analysis.includes("4 Tage unterhalb"));
  assert.ok(result.analysis.includes("50 Tage"));
});
test("missing metrics receive no made-up target achievement or zero", () => {
  const result = insightFor("revenue-fte");
  assert.ok(result.analysis.includes("Keine Personaldaten"));
  assert.ok(result.caveat?.includes("kein Nullwert"));
  assert.ok(!result.analysis.includes("Zielwert"));
});
test("all catalog KPIs have concise definitions, formulas and matching source period", () => {
  for (const period of ["2026-08", "2026-09"]) {
    for (const definition of getKpis(period)) {
      const result = metricInsight(definition.metric, {
        period,
        description: definition.description,
        formula: definition.formula,
        rule: definition.rule,
      });
      assert.ok(result.definition.length > 10);
      assert.ok(result.analysis.length > 10 && result.analysis.length < 500);
      assert.ok(result.formula);
      assert.ok(result.sourceLabel.includes(period));
    }
  }
});
test("summary explanations use current scenario values and distinguish fictional market inputs", () => {
  const ev = summaryInsight("Enterprise Value", "12,50 Mio. €", "Szenario vorsichtig")!;
  assert.ok(ev.analysis.includes("12,50 Mio. €"));
  assert.ok(ev.analysis.includes("Szenario vorsichtig"));
  const fx = summaryInsight("EUR / USD · Demo", "1,1000", "Fiktive Modellannahme")!;
  assert.ok(fx.definition.includes("Keine aktuelle"));
  assert.equal(summaryInsight("Unbekannte Kennzahl", "0", ""), null);
});
