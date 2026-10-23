import { z } from "zod";
import { agentResultSchema, metricSchema, type Metric } from "./contracts.ts";

const sourceId = "demo-ledger-2026";
const metric = (
  id: string,
  label: string,
  value: number,
  unit: Metric["unit"],
  status: Metric["status"],
  delta: number,
  deltaUnit: Metric["unit"],
  assessment: NonNullable<Metric["comparison"]>["assessment"],
  target: string,
): Metric =>
  metricSchema.parse({
    id,
    label,
    value,
    unit,
    status,
    target,
    unavailable_reason: null,
    evidence_ids: [sourceId],
    comparison: {
      label: "zum Vormonat",
      value: delta,
      unit: deltaUnit,
      direction: delta > 0 ? "up" : delta < 0 ? "down" : "stable",
      assessment,
    },
  });

const performanceRowSchema = z.strictObject({
  label: z.string().min(1),
  actual: z.number().finite(),
  budget: z.number().finite(),
  variance: z.number().finite(),
  variancePercent: z.number().finite().nullable(),
  assessment: z.enum(["improving", "stable", "deteriorating"]),
  emphasis: z.boolean().optional(),
});
export type PerformanceRow = z.infer<typeof performanceRowSchema>;
export type Action = {
  id: string;
  priority: "watch" | "info";
  title: string;
  description: string;
  owner: string;
  due: string;
};
const chartPointSchema = z.strictObject({
  month: z.string(),
  revenue: z.number().finite(),
  budget: z.number().finite(),
  ebitda: z.number().finite(),
});
export const revenueHistory = z.array(chartPointSchema).parse([
  { month: "Jan", revenue: 960000, budget: 1000000, ebitda: 120000 },
  { month: "Feb", revenue: 1020000, budget: 1020000, ebitda: 135000 },
  { month: "Mär", revenue: 1080000, budget: 1050000, ebitda: 151000 },
  { month: "Apr", revenue: 1040000, budget: 1080000, ebitda: 139000 },
  { month: "Mai", revenue: 1150000, budget: 1100000, ebitda: 171000 },
  { month: "Jun", revenue: 1120000, budget: 1120000, ebitda: 163000 },
  { month: "Jul", revenue: 1210000, budget: 1150000, ebitda: 190000 },
  { month: "Aug", revenue: 1190000, budget: 1180000, ebitda: 180880 },
  { month: "Sep", revenue: 1280000, budget: 1200000, ebitda: 210000 },
]);

const definitions = [
  {
    id: "2026-09",
    label: "September 2026",
    end: "2026-09-30",
    count: 9,
    headline: "Profitabilität im Ziel. Kapitalbindung im Blick.",
    summary:
      "Der Umsatz liegt über Plan, die EBITDA-Marge bei 16,4 %. Die Forderungslaufzeit sinkt, bleibt aber über dem Ziel von 35 Tagen.",
    metrics: [
      metric(
        "revenue",
        "Umsatz",
        1280000,
        "currency",
        "good",
        7.6,
        "percent",
        "improving",
        "Plan: 1,20 Mio. €",
      ),
      metric(
        "ebitda-margin",
        "EBITDA-Marge",
        16.4,
        "percent",
        "good",
        1.2,
        "percentage_points",
        "improving",
        "Ziel: mindestens 15 %",
      ),
      metric(
        "cash",
        "Liquide Mittel",
        842000,
        "currency",
        "good",
        74000,
        "currency",
        "improving",
        "Mindestbestand: 500 Tsd. €",
      ),
      metric(
        "dso",
        "Forderungslaufzeit",
        46,
        "days",
        "watch",
        -3,
        "days",
        "improving",
        "DSO · Ziel: höchstens 35 Tage",
      ),
    ],
    rows: [
      {
        label: "Umsatzerlöse",
        actual: 1280000,
        budget: 1200000,
        variance: 80000,
        variancePercent: 6.7,
        assessment: "improving",
      },
      {
        label: "Material & Fremdleistungen",
        actual: 692000,
        budget: 648000,
        variance: 44000,
        variancePercent: 6.8,
        assessment: "deteriorating",
      },
      {
        label: "Rohertrag",
        actual: 588000,
        budget: 552000,
        variance: 36000,
        variancePercent: 6.5,
        assessment: "improving",
        emphasis: true,
      },
      {
        label: "Personalaufwand",
        actual: 240000,
        budget: 240000,
        variance: 0,
        variancePercent: 0,
        assessment: "stable",
      },
      {
        label: "Sonstiger Betriebsaufwand",
        actual: 138000,
        budget: 132000,
        variance: 6000,
        variancePercent: 4.5,
        assessment: "deteriorating",
      },
      {
        label: "EBITDA",
        actual: 210000,
        budget: 180000,
        variance: 30000,
        variancePercent: 16.7,
        assessment: "improving",
        emphasis: true,
      },
    ] satisfies PerformanceRow[],
    actions: [
      {
        id: "collections",
        priority: "watch",
        title: "Überfällige Forderungen abbauen",
        description:
          "172 Tsd. € sind mehr als 30 Tage überfällig. Die zehn größten offenen Posten priorisieren und Zahlungszusagen einholen.",
        owner: "Debitorenmanagement",
        due: "05.10.2026",
      },
      {
        id: "costs",
        priority: "watch",
        title: "Fremdleistungen prüfen",
        description:
          "Material und Fremdleistungen liegen 44 Tsd. € über Plan. Mengen- und Preiseffekte im Monatsgespräch prüfen.",
        owner: "Controlling & Einkauf",
        due: "08.10.2026",
      },
      {
        id: "margin",
        priority: "info",
        title: "Ergebnisqualität absichern",
        description:
          "30 Tsd. € EBITDA über Plan. Wiederkehrende Effekte für den nächsten Forecast dokumentieren.",
        owner: "Finance",
        due: "12.10.2026",
      },
    ] satisfies Action[],
  },
  {
    id: "2026-08",
    label: "August 2026",
    end: "2026-08-31",
    count: 8,
    headline: "Ergebnis auf Kurs. Forderungen brauchen Aufmerksamkeit.",
    summary:
      "Der Umsatz liegt leicht über Plan. Die EBITDA-Marge erreicht 15,2 %, während die Forderungslaufzeit auf 49 Tage steigt.",
    metrics: [
      metric(
        "revenue",
        "Umsatz",
        1190000,
        "currency",
        "good",
        -1.7,
        "percent",
        "deteriorating",
        "Plan: 1,18 Mio. €",
      ),
      metric(
        "ebitda-margin",
        "EBITDA-Marge",
        15.2,
        "percent",
        "good",
        -0.5,
        "percentage_points",
        "deteriorating",
        "Ziel: mindestens 15 %",
      ),
      metric(
        "cash",
        "Liquide Mittel",
        768000,
        "currency",
        "good",
        -22000,
        "currency",
        "deteriorating",
        "Mindestbestand: 500 Tsd. €",
      ),
      metric(
        "dso",
        "Forderungslaufzeit",
        49,
        "days",
        "watch",
        2,
        "days",
        "deteriorating",
        "DSO · Ziel: höchstens 35 Tage",
      ),
    ],
    rows: [
      {
        label: "Umsatzerlöse",
        actual: 1190000,
        budget: 1180000,
        variance: 10000,
        variancePercent: 0.8,
        assessment: "improving",
      },
      {
        label: "Material & Fremdleistungen",
        actual: 642600,
        budget: 637200,
        variance: 5400,
        variancePercent: 0.8,
        assessment: "deteriorating",
      },
      {
        label: "Rohertrag",
        actual: 547400,
        budget: 542800,
        variance: 4600,
        variancePercent: 0.8,
        assessment: "improving",
        emphasis: true,
      },
      {
        label: "Personalaufwand",
        actual: 235000,
        budget: 235000,
        variance: 0,
        variancePercent: 0,
        assessment: "stable",
      },
      {
        label: "Sonstiger Betriebsaufwand",
        actual: 131520,
        budget: 130800,
        variance: 720,
        variancePercent: 0.6,
        assessment: "deteriorating",
      },
      {
        label: "EBITDA",
        actual: 180880,
        budget: 177000,
        variance: 3880,
        variancePercent: 2.2,
        assessment: "improving",
        emphasis: true,
      },
    ] satisfies PerformanceRow[],
    actions: [
      {
        id: "collections",
        priority: "watch",
        title: "Zahlungseingänge beschleunigen",
        description:
          "Die Forderungslaufzeit liegt bei 49 Tagen. Fällige Posten abstimmen und Mahnläufe mit dem Vertrieb koordinieren.",
        owner: "Debitorenmanagement",
        due: "04.09.2026",
      },
      {
        id: "costs",
        priority: "watch",
        title: "Kostenabweichungen abstimmen",
        description:
          "Material und Fremdleistungen liegen 5,4 Tsd. € über Plan. Abweichungen auf Projektebene überprüfen.",
        owner: "Controlling & Einkauf",
        due: "08.09.2026",
      },
      {
        id: "margin",
        priority: "info",
        title: "Forecast aktualisieren",
        description:
          "Die Marge liegt über dem Ziel. Bestätigte Aufträge und Kostenannahmen für September abstimmen.",
        owner: "Finance",
        due: "10.09.2026",
      },
    ] satisfies Action[],
  },
];

// Explicit fixtures, not live calculations or generated agent responses.
export const demoSnapshots = definitions.map((snapshot) => {
  const result = agentResultSchema.parse({
    schema_version: "1.0",
    request_id: `demo-${snapshot.id}`,
    company_id: "demo-mittelstand",
    agent: "kpi-monitor",
    period: { start: `${snapshot.id}-01`, end: snapshot.end },
    currency: "EUR",
    data_cutoff: `${snapshot.end}T18:00:00Z`,
    generated_at: `${snapshot.end}T18:00:00Z`,
    sources: [
      {
        id: sourceId,
        label: "Fiktiver Demo-Monatsabschluss",
        kind: "demo",
        as_of: `${snapshot.end}T18:00:00Z`,
      },
    ],
    assumptions: ["Fiktives Unternehmen; alle Werte und Bewertungen sind kuratierte Demodaten."],
    warnings: ["Keine Live-Daten. Keine ausgeführte KI-Analyse."],
    metrics: snapshot.metrics,
    alerts: [],
    summary: snapshot.summary,
  });
  if (result.agent !== "kpi-monitor") throw new Error("Unexpected demo result");
  return { ...snapshot, rows: z.array(performanceRowSchema).parse(snapshot.rows), result };
});
export type DemoSnapshot = (typeof demoSnapshots)[number];
