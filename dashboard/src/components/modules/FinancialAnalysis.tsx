"use client";
import { useTranslation } from "@/components/i18n/Language";
import { useState } from "react";
import { getPnl } from "@/lib/demo-company";
import { formatCompactCurrency, formatDelta, formatValue } from "@/lib/format";
import { downloadCsv } from "@/lib/export";
import { useDemo } from "@/components/shared/DemoProvider";
import { ModulePage, Panel } from "@/components/shared/ModulePage";
import { HorizontalBars, SummaryStat } from "@/components/shared/Visuals";
import { PerformanceTable } from "@/components/dashboard/PerformanceTable";

export function FinancialAnalysis() {
  const { t } = useTranslation();

  const { period, snapshot } = useDemo();
  const [ytd, setYtd] = useState(false);
  const rows = getPnl(period, ytd);
  const revenue = rows[0],
    gross = rows[2],
    ebitda = rows[5];
  const totalCosts = rows[1].actual + rows[3].actual + rows[4].actual;
  const bridge = [
    { label: "Umsatzeffekt", value: revenue.variance },
    { label: "Material & Fremdleistungen", value: -rows[1].variance },
    { label: "Personal", value: -rows[3].variance },
    { label: "Sonstige Aufwendungen", value: -rows[4].variance },
  ];
  return (
    <ModulePage
      eyebrow={t("Finanzanalyse")}
      title={
        <>
          {t(" Ergebnis verstehen. ")}
          <em>{t("Treiber erkennen.")}</em>
        </>
      }
      description={t(
        "Vom Umsatz bis zum EBITDA: Planabweichungen und Kostenstruktur nachvollziehen.",
      )}
      context={t(ytd ? "Kumuliert seit Januar" : "Monatswerte")}
      action={
        <button
          className="button"
          onClick={() =>
            downloadCsv(`Finanzanalyse-Demo-${period}-${ytd ? "YTD" : "Monat"}.csv`, [
              ["DEMODATEN", snapshot.label, ytd ? "YTD" : "Monat"],
              ["Position", "Ist EUR", "Plan EUR", "Abweichung EUR", "Abweichung Prozent"],
              ...rows.map((r) => [r.label, r.actual, r.budget, r.variance, r.variancePercent]),
            ])
          }
        >
          {t(" CSV exportieren ↗ ")}
        </button>
      }
    >
      <div className="module-toolbar">
        <div className="filter-pills" role="group" aria-label={t("Auswertungszeitraum")}>
          <button aria-pressed={!ytd} onClick={() => setYtd(false)}>
            {t(" Monat ")}
          </button>
          <button aria-pressed={ytd} onClick={() => setYtd(true)}>
            {t(" Januar bis ")}
            {t(snapshot.label.split(" ")[0])}
          </button>
        </div>
        <span className="small-muted">{t("Ergebnisrechnung · Gesamtkosten-Sicht der Demo")}</span>
      </div>
      <div className="summary-grid">
        <SummaryStat
          label={"Umsatz"}
          value={formatCompactCurrency(revenue.actual)}
          detail={t(`${formatDelta(revenue.variancePercent ?? 0, "percent")} zum Plan`)}
          tone="good"
        />
        <SummaryStat
          label={"Rohertragsmarge"}
          value={formatValue((gross.actual / revenue.actual) * 100, "percent")}
          detail={t("Nach Material und Fremdleistungen")}
        />
        <SummaryStat
          label={"EBITDA"}
          value={formatCompactCurrency(ebitda.actual)}
          detail={t(`${formatDelta(ebitda.variance, "currency")} zum Plan`)}
          tone={ebitda.assessment === "deteriorating" ? "warning" : "good"}
        />
        <SummaryStat
          label={"EBITDA-Marge"}
          value={formatValue((ebitda.actual / revenue.actual) * 100, "percent")}
          detail={t("Ergebnis vor Abschreibungen, Zinsen und Steuern")}
        />
      </div>
      <div className="module-two-column">
        <Panel index="01 / Ergebnisbrücke" title={t("Vom Plan zum Ist")}>
          <div className="bridge-endpoints">
            <div>
              <span className="label">{t("EBITDA Plan")}</span>
              <strong>{t(formatCompactCurrency(ebitda.budget))}</strong>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <span className="label">{t("EBITDA Ist")}</span>
              <strong>{t(formatCompactCurrency(ebitda.actual))}</strong>
            </div>
          </div>
          <div className="bridge-list">
            {bridge.map((row) => (
              <div key={row.label}>
                <span>{t(row.label)}</span>
                <div className="bridge-track">
                  <i
                    style={{
                      width: `${(Math.abs(row.value) / Math.max(...bridge.map((b) => Math.abs(b.value)), 1)) * 100}%`,
                      background: row.value >= 0 ? "var(--flow-in)" : "var(--flow-out)",
                    }}
                  />
                </div>
                <strong
                  className="tabular"
                  data-assessment={
                    row.value > 0 ? "improving" : row.value < 0 ? "deteriorating" : "stable"
                  }
                >
                  {t(formatDelta(row.value, "currency"))}
                </strong>
              </div>
            ))}
          </div>
          <div className="panel-note">
            {t(
              " Additive Ergebniswirkung: Umsatzabweichung abzüglich Kostenabweichungen. Keine unbelegte Aufteilung in Preis- und Mengeneffekte. ",
            )}
          </div>
        </Panel>
        <Panel index="02 / Kostenstruktur" title={t("Wohin der Umsatz fließt")}>
          <HorizontalBars
            rows={[
              { label: "Material & Fremdleistungen", value: rows[1].actual },
              { label: "Personal", value: rows[3].actual, color: "var(--series-2)" },
              { label: "Sonstige Aufwendungen", value: rows[4].actual, color: "var(--series-3)" },
            ]}
          />
          <div className="cost-summary">
            <span>{t("Operative Aufwendungen")}</span>
            <strong>{t(formatCompactCurrency(totalCosts))}</strong>
            <span>
              {t(formatValue((totalCosts / revenue.actual) * 100, "percent"))} {t(" des Umsatzes")}
            </span>
          </div>
        </Panel>
      </div>
      <Panel
        index="03 / Detailansicht"
        title={t("Ergebnisrechnung")}
        action={
          <span className="panel-period">
            {t(ytd ? "YTD · " : "")}
            {t(snapshot.label)}
          </span>
        }
      >
        <PerformanceTable rows={rows} period={`${ytd ? "YTD " : ""}${snapshot.label}`} />
        <div className="table-note">
          <span>{t("Positive Kostenabweichungen wirken ergebnismindernd.")}</span>
          <span>{t("Fiktiver Demo-Monatsabschluss")}</span>
        </div>
      </Panel>
      <div className="methodology-note">
        <strong>{t("Abgrenzung")}</strong>
        <p>
          {t(
            " EBITDA ist keine Liquiditätskennzahl. Abschreibungen, Zinsen und Steuern sind in dieser Ergebnisübersicht nicht enthalten. Für Cashflow und Zahlungsziele das Working-Capital-Modul verwenden. ",
          )}
        </p>
      </div>
    </ModulePage>
  );
}
