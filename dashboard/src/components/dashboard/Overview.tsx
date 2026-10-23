"use client";
import { Select } from "@/components/ui/Select";
import { getLocale } from "@/lib/i18n";
import { useTranslation } from "@/components/i18n/Language";
import Link from "next/link";
import { useState } from "react";
import { FinancialStatementsOverview } from "@/components/shared/FinancialStatementsOverview";
import { getKpis } from "@/lib/demo-company";
import { metricInsight } from "@/lib/insights";
import { useDemo } from "@/components/shared/DemoProvider";
import { downloadCsv } from "@/lib/export";
import { KpiCard } from "@/components/ui/KpiCard";
import { RevenueChart } from "./RevenueChart";
import { PerformanceTable } from "./PerformanceTable";

export function Overview() {
  const { t } = useTranslation();

  const { snapshots, history, period, setPeriod, snapshot, rules } = useDemo();
  const [range, setRange] = useState(6);
  const [series, setSeries] = useState<"revenue" | "ebitda">("revenue");
  const definitions = getKpis(period, rules);
  const points = history.slice(0, snapshot.count).slice(-range);
  const endDate = new Intl.DateTimeFormat(getLocale(), { timeZone: "UTC" }).format(
    new Date(snapshot.result.period.end),
  );

  function exportCsv() {
    const rows = [
      ["DEMODATEN – Mittelstand GmbH – " + snapshot.label],
      ["Position", "Ist EUR", "Plan EUR", "Abweichung EUR", "Abweichung Prozent"],
      ...snapshot.rows.map((r) => [
        r.label,
        r.actual,
        r.budget,
        r.variance,
        r.variancePercent ?? "",
      ]),
    ];
    downloadCsv(`CFO-Demo-${period}.csv`, rows);
  }

  return (
    <div className="overview">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {t(" Finance Cockpit ")}
            <span>/</span> {t(" Übersicht ")}
          </p>
          <h1>
            {t(" Das Wesentliche. ")}
            <em>{t("Im Blick.")}</em>
          </h1>
          <p className="page-intro">
            {t("Performance, Liquidität und die nächsten Entscheidungen.")}
          </p>
        </div>
        <div className="page-controls">
          <label className="period-control">
            <span className="sr-only">{t("Berichtsmonat")}</span>
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
            >
              <rect x="3" y="4" width="14" height="13" />
              <path d="M3 8h14M7 2v4m6-4v4" />
            </svg>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              {snapshots.map((s) => (
                <option value={s.id} key={s.id}>
                  {t(s.label)}
                </option>
              ))}
            </Select>
          </label>
          <button className="button export-button" onClick={exportCsv}>
            {t(" CSV exportieren ")}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>

      <div className="data-context">
        <span className="demo-context">
          <span className="context-square" aria-hidden="true" />
          {t(" Demo-Arbeitsbereich ")}
        </span>
        <span>
          {t("Fiktive Daten · Monatsabschluss ")}
          {t(endDate)}
        </span>
        <span className="context-currency">{t("EUR · Monatswerte")}</span>
      </div>

      <div className="demo-explainer">
        <span className="demo-explainer-icon" aria-hidden="true">
          {t(" i ")}
        </span>
        <div>
          <strong>{t("Ein CFO-Cockpit zum Ausprobieren.")}</strong>
          <p>
            {t(
              " Monate wechseln, Szenarien testen und Kennzahlen verstehen: Beim Darüberfahren über eine Kennzahlenkarte öffnet sich eine kurze Einordnung. Über das Info-Symbol geht es auch per Tastatur oder Antippen. ",
            )}
          </p>
        </div>
        <span className="demo-explainer-meta">
          {t(" Beispieldaten ")}
          <br />
          {t(" Ohne Anmeldung ")}
        </span>
      </div>

      <section
        className="kpi-grid"
        aria-label={t("Finanzielle Kernkennzahlen")}
        aria-live="polite"
        aria-atomic="true"
      >
        {snapshot.result.metrics.map((metric, index) => {
          const definition = definitions.find((d) => d.metric.id === metric.id)!;
          return (
            <KpiCard
              key={metric.id}
              metric={metric}
              index={index}
              insight={metricInsight(metric, {
                period: snapshot.label,
                description: definition.description,
                formula: definition.formula,
                rule: definition.rule,
              })}
            />
          );
        })}
      </section>

      <section className="management-flash" aria-labelledby="flash-title">
        <span className="flash-index label">
          {t(" Management ")}
          <br />
          {t(" Briefing ")}
        </span>
        <div>
          <h2 id="flash-title">{t(snapshot.headline)}</h2>
          <p>{t(snapshot.summary)}</p>
        </div>
        <a href="#management-actions" className="text-link">
          {t(" Maßnahmen ")}
          <span aria-hidden="true">↗</span>
        </a>
      </section>

      <FinancialStatementsOverview />

      <div className="analysis-grid">
        <section className="panel chart-panel" aria-labelledby="chart-title">
          <div className="panel-heading">
            <div>
              <p className="label">{t("01 / Geschäftsentwicklung")}</p>
              <h2 id="chart-title">{t("Leistung im Zeitverlauf")}</h2>
            </div>
            <div className="segmented" role="group" aria-label={t("Diagrammzeitraum")}>
              {[3, 6, 9].map((months) => (
                <button
                  key={months}
                  aria-pressed={range === months}
                  onClick={() => setRange(months)}
                >
                  {t(months === 9 ? "YTD" : `${months} M`)}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-toolbar">
            <div className="chart-tabs" role="group" aria-label={t("Kennzahl im Diagramm")}>
              <button aria-pressed={series === "revenue"} onClick={() => setSeries("revenue")}>
                {t(" Umsatz ")}
              </button>
              <button aria-pressed={series === "ebitda"} onClick={() => setSeries("ebitda")}>
                {t(" EBITDA ")}
              </button>
            </div>
            <span className="chart-unit">{t("in Tsd. € · 2026")}</span>
          </div>
          <RevenueChart points={points} series={series} />
          <div className="chart-footer">
            <span>
              <i className={series === "revenue" ? "legend-actual" : "legend-ebitda"} />
              {t(" Ist ")}
              {t(series === "revenue" ? "Umsatz" : "EBITDA")}
            </span>
            {series === "revenue" && (
              <span>
                <i className="legend-plan" />
                {t(" Plan Umsatz ")}
              </span>
            )}
            <span className="chart-footnote">{t("Fiktive Monatswerte")}</span>
          </div>
        </section>

        <section
          className="panel action-panel"
          id="management-actions"
          aria-labelledby="actions-title"
        >
          <div className="panel-heading">
            <div>
              <p className="label">{t("02 / Handlungsfelder")}</p>
              <h2 id="actions-title">{t("Nächste Schritte")}</h2>
            </div>
            <span className="count-badge">03</span>
          </div>
          <p className="action-intro">{t("Vorgeschlagene Maßnahmen aus dem Demoabschluss.")}</p>
          <ol className="action-list">
            {snapshot.actions.map((action, index) => (
              <li key={action.id}>
                <div className="action-top">
                  <span className="action-number">0{index + 1}</span>
                  <span
                    className="status"
                    data-status={action.priority === "watch" ? "watch" : "neutral"}
                  >
                    <span className="status-dot" />
                    {t(action.priority === "watch" ? "Prüfen" : "Vorbereiten")}
                  </span>
                </div>
                <h3>
                  <Link
                    href={
                      action.id === "collections"
                        ? "/working-capital#ueberfaellig"
                        : action.id === "costs"
                          ? "/guv"
                          : "/analyse"
                    }
                  >
                    {t(action.title)} ↗
                  </Link>
                </h3>
                <p>{t(action.description)}</p>
                <div className="action-meta">
                  <span>{t(action.owner)}</span>
                  <time dateTime={action.due.split(".").reverse().join("-")}>{t(action.due)}</time>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section
        className="panel performance-panel"
        id="performance"
        aria-labelledby="performance-title"
      >
        <div className="panel-heading">
          <div>
            <p className="label">{t("03 / Ergebnisrechnung")}</p>
            <h2 id="performance-title">{t("Ist und Plan im Vergleich")}</h2>
          </div>
          <span className="panel-period">
            {t(snapshot.label)} {t(" · EUR")}
          </span>
        </div>
        <PerformanceTable rows={snapshot.rows} period={snapshot.label} />
        <div className="table-note">
          <span>{t("Abweichung = Ist − Plan. Farbe zeigt die wirtschaftliche Wirkung.")}</span>
          <span>{t("Quelle: Demo-Monatsabschluss")}</span>
        </div>
      </section>
      <footer className="overview-footer">
        <span>
          {t(" STRICKER INTERIM ")}
          <span aria-hidden="true">/</span> {t(" CFO Dashboard ")}
        </span>
        <span>{t("Demo · Keine Live-Daten oder ausgeführte KI-Analyse")}</span>
      </footer>
    </div>
  );
}
