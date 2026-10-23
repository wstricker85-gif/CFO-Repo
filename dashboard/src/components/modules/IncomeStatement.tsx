"use client";
import { useTranslation } from "@/components/i18n/Language";
import Link from "next/link";
import { useState } from "react";
import { getIncomeHistory, getIncomeStatement } from "@/lib/statements";
import { formatCompactCurrency, formatDelta, formatValue } from "@/lib/format";
import { downloadCsv } from "@/lib/export";
import { useDemo } from "@/components/shared/DemoProvider";
import { ModulePage, Panel } from "@/components/shared/ModulePage";
import { SummaryStat } from "@/components/shared/Visuals";
import { StatementControls } from "@/components/shared/StatementControls";
import { StatementAnalysis } from "@/components/shared/StatementAnalysis";
import { StatementTable } from "@/components/shared/StatementTable";

export function IncomeStatement() {
  const { t } = useTranslation();

  const { period, snapshot } = useDemo();
  const [ytd, setYtd] = useState(false),
    [details, setDetails] = useState(true),
    [scale, setScale] = useState<"eur" | "thousand">("thousand");
  const result = getIncomeStatement(period, ytd),
    history = getIncomeHistory(period);
  const rows = details ? result.rows : result.rows.filter((r) => r.kind !== "detail");
  const max = Math.max(...history.map((m) => m.ebitda), 1);
  const varianceText =
    result.netVariance.absolute === 0
      ? "auf Plan"
      : `${formatCompactCurrency(Math.abs(result.netVariance.absolute))} ${result.netVariance.absolute > 0 ? "über" : "unter"} Plan`;
  function exportStatement() {
    downloadCsv(`GuV-Demo-${period}-${ytd ? "YTD" : "Monat"}.csv`, [
      ["DEMO-GUV – Mittelstand GmbH", result.start, result.end],
      ["Position", "Ist EUR", "Plan EUR", "Abweichung EUR"],
      ...result.rows.map((r) => [
        r.label,
        r.value,
        r.budget ?? null,
        r.budget === undefined ? null : r.value - r.budget,
      ]),
    ]);
  }
  return (
    <ModulePage
      eyebrow={t("GuV")}
      title={
        <>
          {t(" Vom Umsatz zum Ergebnis. ")}
          <em>{t("Jede Stufe erklärt.")}</em>
        </>
      }
      description={t(
        "Gewinn- und Verlustrechnung mit Planvergleich, Ergebnisentwicklung und nachvollziehbarer Analyse.",
      )}
      context={t(ytd ? "GuV · Januar bis Stichtag" : "GuV · Monatswerte")}
      action={
        <button className="button" onClick={exportStatement}>
          {t(" GuV exportieren ↗ ")}
        </button>
      }
    >
      <p className="inline-note">
        <Link href="/ifrs">
          {t(" HGB → IFRS: Ergebniswirkungen ausgewählter Anpassungen untersuchen ↗ ")}
        </Link>
      </p>
      <StatementControls
        ytd={ytd}
        setYtd={setYtd}
        scale={scale}
        setScale={setScale}
        details={details}
        setDetails={setDetails}
      />
      <div className="summary-grid">
        <SummaryStat
          label={"Umsatz"}
          value={formatCompactCurrency(result.revenue)}
          detail={t(ytd ? "Kumuliert seit Januar" : "Im gewählten Berichtsmonat")}
        />
        <SummaryStat
          label={"EBIT / Betriebsergebnis"}
          value={formatCompactCurrency(result.ebit)}
          detail={t(`${formatValue(result.ebitMargin, "percent")} EBIT-Marge`)}
        />
        <SummaryStat
          label={"Ergebnis nach Steuern"}
          value={formatCompactCurrency(result.netIncome)}
          detail={t(varianceText)}
          tone={result.netVariance.absolute >= 0 ? "good" : "watch"}
        />
        <SummaryStat
          label={"Nettoergebnismarge"}
          value={formatValue(result.netMargin, "percent")}
          detail={t("Ergebnis nach Steuern im Verhältnis zum Umsatz")}
        />
      </div>
      <StatementAnalysis
        title={t("Was nach allen Ergebnisstufen bleibt")}
        points={[
          {
            label: "Operatives Ergebnis",
            text: `Vom EBITDA von ${formatCompactCurrency(result.ebitda)} verbleiben nach ${formatCompactCurrency(result.depreciation)} Abschreibungen ${formatCompactCurrency(result.ebit)} EBIT.`,
          },
          {
            label: "Zinsen & Steuern",
            text: `${formatCompactCurrency(result.interest)} Zinsaufwand und ${formatCompactCurrency(result.taxes)} modellierte Ertragsteuern führen zu ${formatCompactCurrency(result.netIncome)} Ergebnis nach Steuern.`,
          },
          {
            label: "Planabweichung",
            text: `Das Ergebnis nach Steuern liegt ${varianceText}. Der Planwert beträgt ${formatCompactCurrency(result.planNetIncome)}; die Differenz ist ${formatDelta(result.netVariance.absolute, "currency")}.`,
          },
        ]}
      />
      <Panel
        index="01 / Gewinn- und Verlustrechnung"
        title={t(ytd ? "GuV · Januar bis Stichtag" : "GuV · Monatsabschluss")}
        action={
          <span className="panel-period">
            {t(snapshot.label)} · {t(scale === "eur" ? "EUR" : "Tsd. €")}
          </span>
        }
      >
        <StatementTable
          rows={rows}
          comparisonKey="budget"
          comparisonLabel={t("Plan")}
          periodLabel={t(`${ytd ? "YTD · " : ""}${snapshot.label}`)}
          scale={scale}
          income
        />
        <div className="table-note">
          <span>
            {t(
              " Erträge positiv, Aufwendungen negativ. Δ = Ist − Plan; positive Ergebniswirkungen sind grün. ",
            )}
          </span>
          <span>{t("Gerundete Anzeige · CSV immer in EUR")}</span>
        </div>
      </Panel>
      <Panel index="02 / Ergebnisentwicklung" title={t("EBITDA, EBIT und Ergebnis nach Steuern")}>
        <div
          className="earnings-chart"
          role="img"
          aria-label={t(
            "Monatliche Ergebnisstufen bis zum Stichtag. Genaue Werte in der Datentabelle darunter.",
          )}
        >
          {history.map((m) => (
            <div className="earnings-column" key={m.month}>
              <div className="earnings-bars">
                {[
                  { value: m.ebitda, color: "var(--series-1)", name: "EBITDA" },
                  { value: m.ebit, color: "var(--series-2)", name: "EBIT" },
                  { value: m.netIncome, color: "var(--series-3)", name: "Ergebnis nach Steuern" },
                ].map((bar) => (
                  <i
                    key={bar.name}
                    style={{
                      height: `${(Math.max(0, bar.value) / max) * 100}%`,
                      background: bar.color,
                    }}
                    title={t(`${m.month}: ${bar.name} ${formatValue(bar.value, "currency")}`)}
                  />
                ))}
              </div>
              <span>{t(m.month)}</span>
            </div>
          ))}
        </div>
        <div className="chart-footer">
          <span>
            <i className="legend-actual" />
            {t(" EBITDA ")}
          </span>
          <span>
            <i className="legend-ebitda" />
            {t(" EBIT ")}
          </span>
          <span>
            <i className="legend-net-income" />
            {t(" Ergebnis nach Steuern ")}
          </span>
        </div>
        <details className="statement-chart-data">
          <summary>{t("Ergebniswerte anzeigen")}</summary>
          <div className="table-scroll">
            <table className="data-table">
              <caption className="sr-only">
                {t("Monatliche Ergebniswerte der Demo in Euro")}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t("Monat")}</th>
                  {["EBITDA", "EBIT", "Ergebnis nach Steuern"].map((label) => (
                    <th scope="col" className="number-cell" key={label}>
                      {t(label)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((m) => (
                  <tr key={m.month}>
                    <th scope="row">{t(m.month)} 2026</th>
                    {[m.ebitda, m.ebit, m.netIncome].map((v, i) => (
                      <td key={i} className="number-cell">
                        {t(formatValue(v, "currency"))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Panel>
      <div className="statement-links">
        <Link href="/bilanz">{t("Ergebnis im Eigenkapital nachvollziehen ↗")}</Link>
        <Link href="/cashflow">{t("Vom Ergebnis zum Cashflow ↗")}</Link>
      </div>
      <div className="methodology-note">
        <strong>{t("Management-GuV der Demo")}</strong>
        <p>
          {t(
            " Vereinfachte GKV-orientierte Darstellung mit zusätzlichen Ergebnisstufen. Kein vollständiger gesetzlicher Jahresabschluss. Bestandsveränderungen fertiger/unfertiger Erzeugnisse, aktivierte Eigenleistungen und weitere Erträge sind hier null. Ertragsteuern: 30 % auf positive monatliche Ergebnisse ohne Verlustverrechnung. EBIT und Steueraufwand sind keine Zahlungsgrößen. ",
          )}
        </p>
      </div>
    </ModulePage>
  );
}
