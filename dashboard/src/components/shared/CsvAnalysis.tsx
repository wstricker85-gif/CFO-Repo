"use client";
import { useTranslation } from "@/components/i18n/Language";
import { useId, useState } from "react";
import { csvColumns, type ImportedMonth } from "@/lib/csv";
import { analyzeCsv, adjacentMonths, type CsvStat } from "@/lib/csv-analysis";
import { formatCompactCurrency, formatValue } from "@/lib/format";
import { downloadCsv } from "@/lib/export";
import { Panel } from "./ModulePage";
import { SummaryStat } from "./Visuals";
export function CsvAnalysis({ rows }: { rows: ImportedMonth[] }) {
  const { t, language } = useTranslation();

  const [selected, setSelected] = useState("all");
  const [active, setActive] = useState("Ertrag");
  const period = rows.some((r) => r.month === selected) ? selected : "all";
  const result = analyzeCsv(rows, period);
  const exportData = () =>
    downloadCsv("CFO-validierte-Vorschau.csv", [
      [
        ...csvColumns.map((c) => (language === "en" ? c.aliases[1] : c.label)),
        "EBITDA",
        "EBIT",
        "ErgebnisNachSteuern",
      ],
      ...rows.map((r) => [...csvColumns.map((c) => r[c.key]), r.ebitda, r.ebit, r.netIncome]),
    ]);
  return (
    <>
      <div className="module-toolbar csv-analysis-controls">
        <label className="select-control">
          {t(" Ergebniszeitraum ")}
          <select value={period} onChange={(e) => setSelected(e.target.value)}>
            <option value="all">{t("Gesamter Dateizeitraum")}</option>
            {rows.map((r) => (
              <option key={r.month} value={r.month}>
                {t(r.month)}
              </option>
            ))}
          </select>
        </label>
        <span className="small-muted">
          {result.count} {t(" ausgewertete Monate · Bilanzbestände: Ende ")}
          {t(result.latestMonth)}
        </span>
        <button className="button" onClick={exportData}>
          {t(" Auswertung exportieren ↗ ")}
        </button>
      </div>
      <div
        className="filter-pills csv-analysis-tabs"
        role="group"
        aria-label={t("Auswertungsbereich")}
      >
        {[...result.sections.map((s) => s.title), "Plan & Entwicklung"].map((label) => (
          <button
            key={label}
            aria-pressed={active === label}
            aria-controls="csv-active-analysis"
            onClick={() => setActive(label)}
          >
            {t(label)}
          </button>
        ))}
      </div>
      <div id="csv-active-analysis">
        {result.sections
          .filter((section) => section.title === active)
          .map((section, i) => (
            <section
              key={section.title}
              className="csv-analysis-section"
              aria-labelledby={`csv-analysis-${i}`}
            >
              <div className="csv-section-heading">
                <h3 id={`csv-analysis-${i}`}>{t(section.title)}</h3>
                <span>{t(section.basis)}</span>
              </div>
              <div className="summary-grid">
                {section.stats.map((stat) => (
                  <CsvStatCard key={stat.label} stat={stat} />
                ))}
              </div>
            </section>
          ))}
        {active === "Plan & Entwicklung" && (
          <section className="csv-analysis-section" aria-labelledby="csv-comparison-title">
            <div className="csv-section-heading">
              <h3 id="csv-comparison-title">{t("Plan & Entwicklung")}</h3>
              <span>{t("Plan: gewählter Zeitraum · Vormonat: letzter ausgewerteter Monat")}</span>
            </div>
            <div className="summary-grid">
              {result.comparisons.map((stat) => (
                <CsvStatCard key={stat.label} stat={stat} />
              ))}
            </div>
          </section>
        )}
      </div>
      <details className="csv-analysis-details">
        <summary>{t("Einordnung & Hinweise zur Datei")}</summary>
        <div className="csv-commentary">
          {result.commentary.map((p) => (
            <p key={p}>{t(p)}</p>
          ))}
        </div>
      </details>
      <details className="csv-analysis-details">
        <summary>{t("Monatsverläufe ansehen · Umsatz, EBITDA & liquide Mittel")}</summary>
        <Panel index="Verlauf" title={t("Alle Monate deiner Datei")}>
          <div className="csv-trends">
            {(
              [
                ["Umsatz", "revenue"],
                ["EBITDA", "ebitda"],
                ["Liquide Mittel", "cash"],
              ] as const
            ).map(([label, field]) => (
              <CsvTrend key={field} label={t(label)} rows={rows} field={field} />
            ))}
          </div>
          <p className="panel-note">
            {t(
              " Monatliche Werte in EUR; liquide Mittel sind Stichtagsbestände. Lücken und fehlende Werte werden nicht verbunden. Jeder Verlauf hat seine eigene Skala. ",
            )}
          </p>
        </Panel>
      </details>
      <details className="csv-analysis-details">
        <summary>{t("Geprüfte Quelldaten ansehen")}</summary>
        <Panel index="Geprüfte Quelldaten" title={t("Monatswerte deiner CSV")}>
          <SourceTable rows={rows} />
          <p className="panel-note">
            {t(
              " Die Tabelle und der Export enthalten alle Monate der Datei. Leere optionale Angaben bleiben „Nicht verfügbar“. Kein vollständiger Cashflow oder vollständiger Abschluss aus diesen Summen ableitbar. ",
            )}
          </p>
        </Panel>
      </details>
    </>
  );
}
function CsvStatCard({ stat }: { stat: CsvStat }) {
  const { t } = useTranslation();

  return (
    <SummaryStat
      label={stat.label}
      value={
        stat.value === null
          ? "Nicht verfügbar"
          : stat.unit === "currency"
            ? formatCompactCurrency(stat.value)
            : formatValue(stat.value, stat.unit)
      }
      detail={t(stat.detail)}
      insight={{
        title: stat.label,
        definition: stat.formula,
        analysis:
          stat.value === null
            ? "Benötigte Angaben fehlen oder der Nenner ist null. Für Zeitraumssummen müssen alle ausgewerteten Monate vollständige Angaben enthalten."
            : `${formatValue(stat.value, stat.unit)}. ${stat.detail}.`,
        formula: stat.formula,
        sourceLabel: "Deine CSV · Lokale Vorschau",
      }}
    />
  );
}
function SourceTable({ rows }: { rows: ImportedMonth[] }) {
  const { t } = useTranslation();

  const [view, setView] = useState<"income" | "capital">("income");
  const columns =
    view === "income"
      ? ([
          "revenue",
          "material",
          "personnel",
          "other",
          "depreciation",
          "interest",
          "taxes",
          "planRevenue",
          "planEbitda",
          "ebitda",
          "ebit",
          "netIncome",
        ] as const)
      : (["cash", "receivables", "inventory", "payables", "equity", "assets"] as const);
  const labels: Record<string, string> = {
    ...Object.fromEntries(csvColumns.map((c) => [c.key, c.label])),
    ebitda: "EBITDA",
    ebit: "EBIT",
    netIncome: "Ergebnis nach Steuern",
  };
  return (
    <div className="csv-source-content">
      <div className="filter-pills" role="group" aria-label={t("Quelldatenbereich")}>
        <button aria-pressed={view === "income"} onClick={() => setView("income")}>
          {t(" Ertrag & Plan ")}
        </button>
        <button aria-pressed={view === "capital"} onClick={() => setView("capital")}>
          {t(" Bilanzbestände ")}
        </button>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label={t("CSV-Quelldaten, horizontal scrollbar")}
      >
        <table className="data-table">
          <caption className="sr-only">{t("Alle validierten Monatswerte in Euro")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("Monat")}</th>
              {columns.map((key) => (
                <th key={key} scope="col" className="number-cell">
                  {t(labels[key])}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month}>
                <th scope="row">{t(r.month)}</th>
                {columns.map((key) => (
                  <td className="number-cell" key={key}>
                    {t(formatValue(r[key], "currency"))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function CsvTrend({
  label,
  rows,
  field,
}: {
  label: string;
  rows: ImportedMonth[];
  field: "revenue" | "ebitda" | "cash";
}) {
  const { t } = useTranslation();

  const id = useId();
  const values = rows.flatMap((r) => (r[field] === null ? [] : [r[field]!]));
  if (!values.length)
    return (
      <div className="csv-trend">
        <h4>{t(label)}</h4>
        <p>{t("Nicht verfügbar · keine Werte vorhanden.")}</p>
      </div>
    );
  const min = Math.min(0, ...values),
    max = Math.max(1, ...values),
    y = (v: number) => 100 - ((v - min) / (max - min)) * 75;
  const segments: string[][] = [];
  let lastMonth = "";
  rows.forEach((row, i) => {
    if (row[field] === null) {
      lastMonth = "";
      return;
    }
    if (!lastMonth || !adjacentMonths(lastMonth, row.month)) segments.push([]);
    segments.at(-1)!.push(`${25 + (i / Math.max(rows.length - 1, 1)) * 270},${y(row[field]!)}`);
    lastMonth = row.month;
  });
  return (
    <div className="csv-trend">
      <h4>{t(label)}</h4>
      <svg viewBox="0 0 320 140" role="img" aria-labelledby={id}>
        <title id={id}>
          {t(label)}:{" "}
          {t(rows.map((r) => `${r.month}: ${formatValue(r[field], "currency")}`).join("; "))}
        </title>
        <text x="5" y="14">
          {t(formatCompactCurrency(max))}
        </text>
        <line x1="25" x2="295" y1={y(0)} y2={y(0)} stroke="var(--line)" />
        {segments.map((points, i) => (
          <g key={i}>
            <polyline
              points={points.join(" ")}
              fill="none"
              stroke="var(--series-1)"
              strokeWidth="2"
            />
            {points.map((point) => {
              const [cx, cy] = point.split(",");
              return <circle key={point} cx={cx} cy={cy} r="3" fill="var(--series-1)" />;
            })}
          </g>
        ))}
        <text x="25" y="130">
          {t(rows[0].month)}
        </text>
        <text x="295" y="130" textAnchor="end">
          {t(rows.at(-1)!.month)}
        </text>
      </svg>
    </div>
  );
}
