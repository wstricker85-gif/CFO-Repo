"use client";
import { useTranslation } from "@/components/i18n/Language";
import { useState } from "react";
import { getForecastMonths, getPnl, scenarios } from "@/lib/demo-company";
import { revenueHistory } from "@/lib/demo-data";
import { forecastScenario, round } from "@/lib/finance";
import { formatCompactCurrency, formatDelta, formatValue } from "@/lib/format";
import { downloadCsv } from "@/lib/export";
import { useDemo } from "@/components/shared/DemoProvider";
import { ModulePage, Panel } from "@/components/shared/ModulePage";
import { SummaryStat } from "@/components/shared/Visuals";

const q4Budget = [
  { month: "Okt", revenue: 1250000, fixed: 378000 },
  { month: "Nov", revenue: 1300000, fixed: 380000 },
  { month: "Dez", revenue: 1350000, fixed: 395000 },
];
export function BudgetPlanner() {
  const { t } = useTranslation();

  const { snapshot, period } = useDemo();
  const [selected, setSelected] = useState("base"),
    [revenueChange, setRevenueChange] = useState(0),
    [fixedChange, setFixedChange] = useState(0);
  const actuals = getPnl(period, true);
  const forecastMonths = getForecastMonths(period);
  const forecast = forecastScenario(forecastMonths, revenueChange, fixedChange);
  const landingRevenue = actuals[0].actual + forecast.reduce((s, m) => s + m.revenue, 0);
  const landingEbitda = actuals[5].actual + forecast.reduce((s, m) => s + m.ebitda, 0);
  const yearPlan = getPnl("2026-09", true);
  const planRevenue = yearPlan[0].budget + q4Budget.reduce((s, m) => s + m.revenue, 0);
  const planEbitda =
    yearPlan[5].budget + q4Budget.reduce((s, m) => s + m.revenue * 0.46 - m.fixed, 0);
  const allMonths = [
    ...revenueHistory.map((m) => ({ month: m.month, budget: m.budget })),
    ...q4Budget.map((m) => ({ month: m.month, budget: m.revenue })),
  ];
  const months = allMonths.map((m, i) => ({
    month: m.month,
    budget: m.budget,
    actual: i < snapshot.count ? revenueHistory[i].revenue : null,
    forecast: i >= snapshot.count ? forecast[i - snapshot.count].revenue : null,
    ebitda: i < snapshot.count ? revenueHistory[i].ebitda : forecast[i - snapshot.count].ebitda,
  }));
  const max = Math.max(...months.map((m) => Math.max(m.actual ?? m.forecast ?? 0, m.budget)));
  function choose(id: string) {
    const s = scenarios.find((s) => s.id === id)!;
    setSelected(id);
    setRevenueChange(s.revenueChange);
    setFixedChange(s.fixedCostChange);
  }
  function exportForecast() {
    downloadCsv(`Forecast-Demo-${period}-${selected}.csv`, [
      ["DEMODATEN – Rolling Forecast", snapshot.label],
      ["Umsatzänderung Restjahr Prozent", revenueChange],
      ["Fixkostenänderung Restjahr Prozent", fixedChange],
      ["Monat", "Ist Umsatz EUR", "Forecast Umsatz EUR", "Plan Umsatz EUR", "EBITDA EUR", "Status"],
      ...months.map((m) => [
        m.month,
        m.actual,
        m.forecast,
        m.budget,
        m.ebitda,
        m.actual === null ? "Forecast" : "Ist gesperrt",
      ]),
      ["Jahresumsatz", landingRevenue],
      ["Jahres-EBITDA", landingEbitda],
    ]);
  }
  return (
    <ModulePage
      eyebrow={t("Budget & Forecast")}
      title={
        <>
          {t(" Vorausdenken. ")}
          <em>{t("Gezielt steuern.")}</em>
        </>
      }
      description={t(
        "Ist-Monate festschreiben, das Restjahr planen und Chancen gegen Risiken abwägen.",
      )}
      context={t("Jahresplanung 2026")}
      action={
        <button className="button" onClick={exportForecast}>
          {t(" Forecast exportieren ↗ ")}
        </button>
      }
    >
      <div className="summary-grid">
        <SummaryStat
          label={"Umsatz Jahreslandung"}
          value={formatCompactCurrency(landingRevenue)}
          detail={t(
            `${formatDelta((landingRevenue / planRevenue - 1) * 100, "percent")} zum Jahresplan`,
          )}
          tone={landingRevenue >= planRevenue ? "good" : "watch"}
        />
        <SummaryStat
          label={"EBITDA Jahreslandung"}
          value={formatCompactCurrency(landingEbitda)}
          detail={t(`${formatDelta(landingEbitda - planEbitda, "currency")} zum Jahresplan`)}
          tone={landingEbitda >= planEbitda ? "good" : "watch"}
        />
        <SummaryStat
          label={"EBITDA-Marge Gesamtjahr"}
          value={formatValue((landingEbitda / landingRevenue) * 100, "percent")}
          detail={t("Ist und Forecast zusammengeführt")}
        />
        <SummaryStat
          label={"Ist-Abdeckung"}
          value={`${snapshot.count} / 12`}
          detail={t(`${12 - snapshot.count} Monate verbleiben im Forecast`)}
        />
      </div>
      <div className="module-two-column">
        <Panel index="01 / Szenariosteuerung" title={t("Das Restjahr gestalten")}>
          <div className="model-controls">
            <div className="filter-pills" role="group" aria-label={t("Forecast-Szenario")}>
              {scenarios.map((s) => (
                <button key={s.id} aria-pressed={selected === s.id} onClick={() => choose(s.id)}>
                  {t(s.label)}
                </button>
              ))}
            </div>
            <p className="small-muted">
              {t(
                scenarios.find((s) => s.id === selected)?.description ??
                  "Eigene Annahmen für die verbleibenden Forecast-Monate.",
              )}
            </p>
            <div className="model-input">
              <label className="range-label" htmlFor="forecast-revenue">
                {t(" Umsatz gegenüber Basis-Forecast ")}
                <strong>{t(formatDelta(revenueChange, "percent"))}</strong>
              </label>
              <input
                id="forecast-revenue"
                type="range"
                min="-20"
                max="20"
                step="1"
                value={revenueChange}
                onChange={(e) => {
                  setRevenueChange(Number(e.target.value));
                  setSelected("custom");
                }}
              />
              <div className="range-endpoints">
                <span>−20 %</span>
                <span>+20 %</span>
              </div>
            </div>
            <div className="model-input">
              <label className="range-label" htmlFor="forecast-fixed">
                {t(" Fixkosten gegenüber Basis-Forecast ")}
                <strong>{t(formatDelta(fixedChange, "percent"))}</strong>
              </label>
              <input
                id="forecast-fixed"
                type="range"
                min="-10"
                max="15"
                step="1"
                value={fixedChange}
                onChange={(e) => {
                  setFixedChange(Number(e.target.value));
                  setSelected("custom");
                }}
              />
              <div className="range-endpoints">
                <span>−10 %</span>
                <span>+15 %</span>
              </div>
            </div>
            <div className="locked-note">
              <span aria-hidden="true">▣</span>
              <p>
                <strong>{t("Ist bleibt Ist.")}</strong> {t(" Alle Monate bis einschließlich ")}
                {t(snapshot.label)}
                {t(" ")}
                {t(" sind festgeschrieben. Regler verändern ausschließlich das Restjahr. ")}
              </p>
            </div>
          </div>
        </Panel>
        <Panel index="02 / Szenariovergleich" title={t("Drei mögliche Jahreslandungen")}>
          <div className="scenario-comparison">
            {scenarios.map((s) => {
              const months = forecastScenario(forecastMonths, s.revenueChange, s.fixedCostChange);
              const revenue = actuals[0].actual + months.reduce((a, m) => a + m.revenue, 0);
              const ebitda = actuals[5].actual + months.reduce((a, m) => a + m.ebitda, 0);
              return (
                <button key={s.id} aria-pressed={selected === s.id} onClick={() => choose(s.id)}>
                  <span className="label">{t(s.label)}</span>
                  <strong>{t(formatCompactCurrency(ebitda))}</strong>
                  <span>
                    {t("EBITDA · ")}
                    {t(formatValue((ebitda / revenue) * 100, "percent"))} {t(" Marge")}
                  </span>
                  <span className="small-muted">
                    {t("Umsatz: ")}
                    {t(formatCompactCurrency(revenue))}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="panel-note">
            {t(
              " Variable Kosten wachsen proportional zum Umsatz, fixe Kosten gemäß gewählter Annahme. Keine automatische Cashflow-Ableitung aus dem EBITDA. ",
            )}
          </div>
        </Panel>
      </div>
      <Panel
        index="03 / Jahresverlauf"
        title={t("Ist und Forecast zusammen sehen")}
        action={<span className="panel-period">{t("Umsatz 2026")}</span>}
      >
        <div
          className="forecast-bars"
          role="img"
          aria-label={t(
            "Monatlicher Umsatz aus Ist und gewähltem Forecast. Exakte Werte stehen in der Tabelle darunter.",
          )}
        >
          {months.map((m, i) => (
            <div className="forecast-column" key={m.month}>
              <div className="forecast-column-track">
                <i
                  className={m.actual !== null ? "forecast-actual" : "forecast-projected"}
                  style={{ height: `${((m.actual ?? m.forecast ?? 0) / max) * 100}%` }}
                />
                <span
                  className="forecast-plan-tick"
                  style={{ bottom: `${(m.budget / max) * 100}%` }}
                />
              </div>
              <span>{t(m.month)}</span>
              {i === snapshot.count - 1 && (
                <small className="forecast-cutoff">{t("Ist bis hier")}</small>
              )}
            </div>
          ))}
        </div>
        <div className="chart-footer">
          <span>
            <i className="legend-actual" />
            {t(" Ist ")}
          </span>
          <span>
            <i className="legend-ebitda" />
            {t(" Forecast ")}
          </span>
          <span>
            <i className="legend-plan" />
            {t(" Plan ")}
          </span>
          <span className="chart-footnote">
            {t("Datenstand: ")}
            {t(snapshot.label)}
          </span>
        </div>
      </Panel>
      <Panel index="04 / Monatsplanung" title={t("Forecast im Detail")}>
        <div className="table-scroll" tabIndex={0} role="region" aria-label={t("Monatsplanung")}>
          <table className="data-table">
            <caption className="sr-only">{t("Ist-Monate und Forecast, alle Werte fiktiv")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("Monat")}</th>
                <th scope="col">{t("Datenart")}</th>
                <th scope="col" className="number-cell">
                  {t(" Umsatz ")}
                </th>
                <th scope="col" className="number-cell">
                  {t(" Umsatzplan ")}
                </th>
                <th scope="col" className="number-cell">
                  {t(" EBITDA ")}
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month}>
                  <th scope="row">{t(m.month)} 2026</th>
                  <td>
                    <span
                      className="type-tag"
                      data-type={m.actual !== null ? "actual" : "forecast"}
                    >
                      {t(m.actual !== null ? "Ist · gesperrt" : "Forecast")}
                    </span>
                  </td>
                  <td className="number-cell">
                    {t(formatValue(m.actual ?? m.forecast, "currency"))}
                  </td>
                  <td className="number-cell muted">{t(formatValue(m.budget, "currency"))}</td>
                  <td className="number-cell">{t(formatValue(m.ebitda, "currency"))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2}>
                  {t(" Gesamtjahr 2026 ")}
                </th>
                <td className="number-cell">{t(formatValue(round(landingRevenue), "currency"))}</td>
                <td className="number-cell">{t(formatValue(planRevenue, "currency"))}</td>
                <td className="number-cell">{t(formatValue(round(landingEbitda), "currency"))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </ModulePage>
  );
}
