import type { Threshold } from "./finance.ts";
import type { DemoSnapshot } from "./demo-data.ts";
import { getKpis } from "./demo-company.ts";
import { formatValue } from "./format.ts";
export type DemoRules = Record<string, Threshold>;
export function validateRules(rules: DemoRules) {
  const allowed = getKpis("2026-09");
  for (const [id, rule] of Object.entries(rules)) {
    const original = allowed.find((d) => d.metric.id === id)?.rule;
    if (
      !original ||
      rule.direction !== original.direction ||
      !Number.isFinite(rule.good) ||
      !Number.isFinite(rule.watch) ||
      rule.good < 0 ||
      rule.watch < 0 ||
      (rule.direction === "higher" ? rule.good <= rule.watch : rule.good >= rule.watch)
    )
      throw new Error(
        "Ungültige Zielkorridore: Grün und Gelb müssen in der richtigen Reihenfolge liegen.",
      );
  }
  return rules;
}
export function applyDemoRules(snapshot: DemoSnapshot, rules: DemoRules): DemoSnapshot {
  if (!Object.keys(rules).length) return snapshot;
  const definitions = getKpis(snapshot.id, rules);
  const metrics = snapshot.result.metrics.map((m) => {
    const updated = definitions.find((d) => d.metric.id === m.id)?.metric;
    return updated ? { ...m, status: updated.status, target: updated.target } : m;
  });
  const dso = definitions.find((d) => d.metric.id === "dso")!;
  const margin = definitions.find((d) => d.metric.id === "ebitda-margin")!;
  const summary = `EBITDA-Marge: ${formatValue(margin.metric.value, "percent")} bei einem Ziel ab ${formatValue(margin.rule!.good, "percent")}. Forderungslaufzeit: ${formatValue(dso.metric.value, "days")} bei einem Ziel bis ${formatValue(dso.rule!.good, "days")}. Eigene Zielwerte gelten für diese Demo-Sitzung.`;
  const alerts = metrics
    .filter((m) => ["watch", "warning", "critical"].includes(m.status))
    .map((m) => ({
      id: `session-${m.id}`,
      metric_id: m.id,
      priority: m.status === "watch" ? ("watch" as const) : ("critical" as const),
      title: `${m.label}: Zielkorridor prüfen`,
      message: `Aktueller Wert ${formatValue(m.value, m.unit)}; ${m.target}.`,
      suggested_action: "Zielwert und zugrunde liegende Detailansicht prüfen.",
      evidence_ids: m.evidence_ids,
    }));
  return {
    ...snapshot,
    metrics,
    result: {
      ...snapshot.result,
      metrics,
      alerts,
      summary,
      assumptions: [
        ...snapshot.result.assumptions,
        ...Object.entries(rules).map(
          ([id, r]) => `Sitzungsziel ${id}: ${r.direction}, Grün ${r.good}, Gelb ${r.watch}.`,
        ),
      ],
    },
    headline: "Ertrag und Kapitalbindung im Zielvergleich.",
    summary,
  };
}
