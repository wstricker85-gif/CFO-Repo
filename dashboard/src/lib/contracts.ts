import { z } from "zod";

export const schemaVersion = "1.0" as const;
const text = z.string().trim().min(1);
const finite = z.number().finite();
const date = z.iso.date();
const timestamp = z.iso.datetime();
export const agentIdSchema = z.enum([
  "orchestrator",
  "financial-analyst",
  "kpi-monitor",
  "budget-planner",
  "market-data",
  "board-report",
]);
export const statusSchema = z.enum([
  "good",
  "watch",
  "warning",
  "critical",
  "neutral",
  "unavailable",
]);
export const assessmentSchema = z.enum(["improving", "stable", "deteriorating", "unknown"]);
export const unitSchema = z.enum([
  "currency",
  "percent",
  "percentage_points",
  "days",
  "multiple",
  "number",
  "score",
]);
export const periodSchema = z
  .strictObject({ start: date, end: date })
  .refine((p) => p.start <= p.end, "Period start must not follow its end");
export const sourceSchema = z.strictObject({
  id: text,
  label: text,
  kind: z.enum(["upload", "engine", "provider", "demo"]),
  as_of: timestamp,
});
export const comparisonSchema = z
  .strictObject({
    label: text,
    value: finite,
    unit: unitSchema,
    direction: z.enum(["up", "down", "stable"]),
    assessment: assessmentSchema,
  })
  .superRefine((c, ctx) => {
    const direction = c.value > 0 ? "up" : c.value < 0 ? "down" : "stable";
    if (c.direction !== direction)
      ctx.addIssue({ code: "custom", message: "Comparison direction must match signed value" });
  });
export const metricSchema = z
  .strictObject({
    id: text,
    label: text,
    value: finite.nullable(),
    unit: unitSchema,
    status: statusSchema,
    comparison: comparisonSchema.nullable(),
    target: text.nullable(),
    unavailable_reason: text.nullable(),
    evidence_ids: z.array(text).min(1),
  })
  .superRefine((m, ctx) => {
    if (
      m.value === null &&
      (m.status !== "unavailable" || !m.unavailable_reason || m.comparison !== null)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Missing metrics require unavailable status/reason and no comparison",
      });
    }
    if (m.value !== null && (m.status === "unavailable" || m.unavailable_reason !== null)) {
      ctx.addIssue({
        code: "custom",
        message: "Available metrics cannot carry an unavailable status/reason",
      });
    }
  });
export type Metric = z.infer<typeof metricSchema>;
export type MetricStatus = z.infer<typeof statusSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type Unit = z.infer<typeof unitSchema>;

export const alertSchema = z.strictObject({
  id: text,
  metric_id: text,
  priority: z.enum(["critical", "watch", "info"]),
  title: text,
  message: text,
  suggested_action: text,
  evidence_ids: z.array(text).min(1),
});
const metaShape = {
  schema_version: z.literal(schemaVersion),
  request_id: text,
  company_id: text,
  period: periodSchema,
  currency: z.string().regex(/^[A-Z]{3}$/),
  data_cutoff: timestamp,
  generated_at: timestamp,
  sources: z.array(sourceSchema),
  assumptions: z.array(text),
  warnings: z.array(text),
};
const sensitivitySchema = z
  .strictObject({
    row_driver: text,
    column_driver: text,
    row_values: z.array(finite).min(2),
    column_values: z.array(finite).min(2),
    values: z.array(z.array(finite.nullable())),
  })
  .refine(
    (s) =>
      s.values.length === s.row_values.length &&
      s.values.every((row) => row.length === s.column_values.length),
    "Sensitivity dimensions must match driver values",
  );

export const financialAnalystSchema = z
  .strictObject({
    ...metaShape,
    agent: z.literal("financial-analyst"),
    analysis_type: z.enum([
      "working_capital",
      "dcf",
      "profitability",
      "leverage",
      "irr",
      "internal_credit_indicator",
    ]),
    metrics: z.array(metricSchema),
    findings: z.array(text),
    recommendations: z.array(text),
    sensitivity: sensitivitySchema.nullable(),
  })
  .superRefine((r, ctx) => {
    if (["dcf", "irr"].includes(r.analysis_type) && r.sensitivity === null) {
      ctx.addIssue({
        code: "custom",
        message: "Valuations/IRR require an engine sensitivity table",
      });
    }
  });
export const kpiMonitorSchema = z
  .strictObject({
    ...metaShape,
    agent: z.literal("kpi-monitor"),
    metrics: z.array(metricSchema),
    alerts: z.array(alertSchema),
    summary: text,
  })
  .superRefine((r, ctx) => {
    const ids = new Set(r.metrics.map((m) => m.id));
    for (const alert of r.alerts) {
      if (!ids.has(alert.metric_id))
        ctx.addIssue({ code: "custom", message: "Alert references an unknown metric" });
    }
    for (const metric of r.metrics) {
      if (
        ["warning", "critical"].includes(metric.status) &&
        !r.alerts.some((a) => a.metric_id === metric.id)
      ) {
        ctx.addIssue({ code: "custom", message: "Red metrics require an alert" });
      }
    }
  });
export const budgetPlannerSchema = z.strictObject({
  ...metaShape,
  agent: z.literal("budget-planner"),
  forecast_date: date,
  report_type: z.enum(["variance", "forecast", "scenario", "cashflow"]),
  metrics: z.array(metricSchema),
  findings: z.array(text),
  scenarios: z.array(z.strictObject({ name: text, metrics: z.array(metricSchema) })),
});
export const marketDataSchema = z.strictObject({
  ...metaShape,
  agent: z.literal("market-data"),
  observations: z.array(
    z
      .strictObject({
        symbol: text,
        metric: metricSchema,
        provider: text,
        as_of: timestamp,
        fetched_at: timestamp,
        cache_age_minutes: finite.nonnegative(),
        ttl_minutes: finite.positive(),
        stale: z.boolean(),
        peers: z.array(text),
      })
      .refine((o) => o.stale === o.cache_age_minutes > o.ttl_minutes, "Stale flag must match TTL"),
  ),
});
export const boardReportSchema = z.strictObject({
  ...metaShape,
  agent: z.literal("board-report"),
  format: z.enum(["executive_flash", "cfo_commentary", "full_board_section"]),
  headline: text,
  markdown: text,
  upstream_request_ids: z.array(text).min(1),
});
const specialistIdSchema = agentIdSchema.exclude(["orchestrator"]);
export const orchestratorSchema = z
  .strictObject({
    ...metaShape,
    agent: z.literal("orchestrator"),
    intent: text,
    output_format: z.enum(["json", "dashboard", "report"]),
    missing_inputs: z.array(text),
    steps: z.array(
      z.strictObject({
        id: text,
        agent: specialistIdSchema,
        depends_on: z.array(text),
        input_refs: z.array(text).min(1),
      }),
    ),
  })
  .superRefine((plan, ctx) => {
    const seen = new Set<string>();
    plan.steps.forEach((step, i) => {
      if (seen.has(step.id)) ctx.addIssue({ code: "custom", message: "Step IDs must be unique" });
      if (step.depends_on.some((id) => !seen.has(id))) {
        ctx.addIssue({
          code: "custom",
          message: "Dependencies must refer to earlier steps (no cycles)",
        });
      }
      if (
        step.agent === "board-report" &&
        (i !== plan.steps.length - 1 || step.depends_on.length === 0)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Board report must be last and depend on validated upstream results",
        });
      }
      seen.add(step.id);
    });
    if (plan.missing_inputs.length > 0 && plan.steps.length > 0) {
      ctx.addIssue({ code: "custom", message: "Resolve missing inputs before executing a plan" });
    }
  });

export const agentResultSchema = z
  .discriminatedUnion("agent", [
    orchestratorSchema,
    financialAnalystSchema,
    kpiMonitorSchema,
    budgetPlannerSchema,
    marketDataSchema,
    boardReportSchema,
  ])
  .superRefine((result, ctx) => {
    const sourceIds = new Set(result.sources.map((s) => s.id));
    if (sourceIds.size !== result.sources.length)
      ctx.addIssue({ code: "custom", message: "Duplicate source IDs" });
    const metrics = "metrics" in result ? result.metrics : [];
    const allMetrics = [
      ...metrics,
      ...("scenarios" in result ? result.scenarios.flatMap((s) => s.metrics) : []),
      ...("observations" in result ? result.observations.map((o) => o.metric) : []),
    ];
    for (const metric of allMetrics) {
      if (metric.evidence_ids.some((id) => !sourceIds.has(id))) {
        ctx.addIssue({
          code: "custom",
          message: "Metric evidence must resolve to a declared source",
        });
      }
    }
    if (
      "alerts" in result &&
      result.alerts.some((a) => a.evidence_ids.some((id) => !sourceIds.has(id)))
    ) {
      ctx.addIssue({ code: "custom", message: "Alert evidence must resolve to a declared source" });
    }
  });
export type AgentResult = z.infer<typeof agentResultSchema>;
