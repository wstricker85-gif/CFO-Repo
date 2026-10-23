"use client";
import { useId } from "react";
import { useTranslation } from "@/components/i18n/Language";
import type { ReportAnalysis as Analysis } from "@/lib/report-analysis";
import { formatCompactCurrency as money, formatValue, formatDelta } from "@/lib/format";
import { CashflowBridge } from "./CashflowBridge";

function EvidenceBars({
  rows,
  title,
}: {
  rows: { label: string; value: number }[];
  title: string;
}) {
  const { t } = useTranslation();
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <figure className="report-figure">
      <figcaption>{t(title)}</figcaption>
      <div
        className="report-evidence-bars"
        role="img"
        aria-label={rows.map((r) => `${t(r.label)}: ${money(r.value)}`).join("; ")}
      >
        {rows.map((r) => (
          <div className="report-evidence-row" key={r.label}>
            <span>{t(r.label)}</span>
            <div className="report-bar-track">
              <span
                className={r.value < 0 ? "is-negative" : ""}
                style={{ width: `${(Math.abs(r.value) / max) * 100}%` }}
              />
            </div>
            <strong>{money(r.value)}</strong>
          </div>
        ))}
      </div>
    </figure>
  );
}
function Trend({ data }: { data: Analysis }) {
  const { t } = useTranslation();
  const id = useId();
  const max = Math.max(...data.trend.flatMap((m) => [m.revenue, m.budget]), 1);
  const maxMargin = Math.max(...data.trend.map((m) => m.margin ?? 0), 1);
  const x = (i: number) => 65 + (i * 590) / Math.max(data.trend.length, 1);
  const y = (v: number) => 160 - (v / max) * 125;
  return (
    <figure className="report-figure report-trend">
      <figcaption>{t("Umsatz und EBITDA-Marge im Jahresverlauf")}</figcaption>
      <p className="report-chart-legend">
        <span>■ {t("Ist")}</span>
        <span>━ {t("Plan")}</span> · {t("Umsatz in Tsd. EUR")}
      </p>
      <svg viewBox="0 0 700 295" role="img" aria-labelledby={id}>
        <title id={id}>
          {t("Umsatz und EBITDA-Marge im Jahresverlauf")}.{" "}
          {data.trend
            .map(
              (m) =>
                `${t(m.month)}: ${money(m.revenue)}, ${t("Plan")} ${money(m.budget)}, ${formatValue(m.margin, "percent")}`,
            )
            .join("; ")}
        </title>
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1="42" x2="672" y1={y(max * v)} y2={y(max * v)} className="chart-gridline" />
            <text x="35" y={y(max * v) + 4} textAnchor="end" className="chart-axis">
              {Math.round((max * v) / 1000)}
            </text>
          </g>
        ))}
        {data.trend.map((m, i) => (
          <g key={m.month}>
            <rect
              x={x(i)}
              y={y(m.revenue)}
              width="22"
              height={160 - y(m.revenue)}
              fill="var(--series-1)"
            />
            <line
              x1={x(i) - 4}
              x2={x(i) + 26}
              y1={y(m.budget)}
              y2={y(m.budget)}
              stroke="var(--chart-plan)"
              strokeWidth="3"
            />
            <text x={x(i) + 11} y="180" textAnchor="middle" className="chart-axis">
              {t(m.month)}
            </text>
            <text x={x(i) + 11} y="285" textAnchor="middle" className="chart-axis">
              {formatValue(m.margin, "percent")}
            </text>
          </g>
        ))}
        <text x="42" y="212" className="chart-axis">
          {t("EBITDA-Marge")}
        </text>
        <polyline
          points={data.trend
            .map((m, i) => `${x(i) + 11},${262 - ((m.margin ?? 0) / maxMargin) * 35}`)
            .join(" ")}
          fill="none"
          stroke="var(--series-2)"
          strokeWidth="2"
        />
        {data.trend.map((m, i) => (
          <circle
            key={i}
            cx={x(i) + 11}
            cy={262 - ((m.margin ?? 0) / maxMargin) * 35}
            r="3"
            fill="var(--series-2)"
          />
        ))}
      </svg>
    </figure>
  );
}
export function ReportAnalysis({
  data,
  includeRisks,
  commentary,
}: {
  data: Analysis;
  includeRisks: boolean;
  commentary: string;
}) {
  const { t } = useTranslation();
  return (
    <>
      <section className="report-section report-overview-findings">
        <h3>{t("Management-Fokus")}</h3>
        <p>{t(commentary)}</p>
        <div className="report-findings">
          <div>
            <span className="label">{t("Ergebnis gegen Plan")}</span>
            <strong>{formatDelta(data.ebitdaGap, "currency")}</strong>
            <p>
              {t(
                data.ebitdaGap >= 0
                  ? "Das EBITDA liegt auf oder über Plan. Kostenabweichungen separat prüfen."
                  : "Das EBITDA liegt unter Plan. Umsatz- und Kosteneffekte gemeinsam prüfen.",
              )}
            </p>
          </div>
          <div>
            <span className="label">{t("Operative Cash-Conversion")}</span>
            <strong>{formatValue(data.cash.cashConversion, "percent")}</strong>
            <p>
              {t(
                "Operativer Cashflow geteilt durch EBITDA. Investitionen und Finanzierung folgen separat.",
              )}
            </p>
          </div>
          {includeRisks && (
            <div>
              <span className="label">{t("Forderungslaufzeit gegen Ziel")}</span>
              <strong>
                {formatValue(data.dso.value, "days")} / {formatValue(data.dso.target, "days")}
              </strong>
              <p>
                {t(
                  data.dso.gap !== null && data.dso.gap > 0
                    ? "Die Forderungslaufzeit überschreitet das Sitzungsziel. Überfällige Rechnungen priorisieren."
                    : "Die Forderungslaufzeit liegt im Sitzungsziel. Zahlungsentwicklung weiter beobachten.",
                )}
              </p>
            </div>
          )}
        </div>
      </section>
      <section className="report-section report-chapter">
        <p className="eyebrow">{t("01 / Performance & Ergebnisqualität")}</p>
        <h3>{t("Wachstum, Marge und Planabweichung")}</h3>
        <Trend data={data} />
        <div className="report-fact-line">
          <span>
            {t("Umsatz YTD")} <strong>{money(data.ytd.revenue)}</strong> · {t("Plan")}{" "}
            {money(data.ytd.revenuePlan)}
          </span>
          <span>
            {t("EBITDA YTD")} <strong>{money(data.ytd.ebitda)}</strong> · {t("Plan")}{" "}
            {money(data.ytd.ebitdaPlan)}
          </span>
        </div>
        <p>
          {t(
            "YTD umfasst Januar bis zum Berichtsmonat; der letzte Balken zeigt den ausgewählten Monat. Die Marge ist je Monat berechnet.",
          )}
        </p>
        <EvidenceBars title="EBITDA-Planbrücke: Ergebnisbeiträge im Monat" rows={data.effects} />
        <div className="report-fact-line">
          <span>
            {t("Plan-EBITDA")} <strong>{money(data.planEbitda)}</strong>
          </span>
          <span>
            {t("Ist-EBITDA")} <strong>{money(data.actualEbitda)}</strong>
          </span>
          <span>
            {t("Abweichung")} <strong>{formatDelta(data.ebitdaGap, "currency")}</strong>
          </span>
        </div>
        <p>
          {t(
            "Positive Beiträge erhöhen das Ergebnis gegenüber Plan; negative Beiträge mindern es. Die Beiträge addieren sich zur EBITDA-Abweichung. Preis, Menge und Mix sind nicht getrennt verfügbar.",
          )}
        </p>
        <h4>{t("Vom operativen Ergebnis zum Periodengewinn")}</h4>
        <dl className="report-statement-summary">
          {[
            { label: "EBITDA", value: data.income.ebitda },
            { label: "Abschreibungen", value: -data.income.depreciation },
            { label: "Zinsen", value: -data.income.interest },
            { label: "Ertragsteuern", value: -data.income.taxes },
            { label: "Ergebnis nach Steuern", value: data.income.netIncome },
          ].map((r) => (
            <div key={r.label}>
              <dt>{t(r.label)}</dt>
              <dd>{money(r.value)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="report-section report-chapter">
        <p className="eyebrow">{t("02 / Kapital & Liquidität")}</p>
        <h3>{t("Bilanzstruktur und Geldbewegungen")}</h3>
        <div className="report-figure-pair">
          <EvidenceBars
            title="Mittelverwendung am Stichtag"
            rows={[
              { label: "Anlagevermögen", value: data.balance.totals.noncurrentAssets },
              { label: "Vorräte", value: data.capital.inventory },
              { label: "Forderungen", value: data.capital.receivables },
              { label: "Liquide Mittel", value: data.capital.cash },
              {
                label: "Sonstiges Umlaufvermögen",
                value:
                  data.balance.totals.currentAssets -
                  data.capital.cash -
                  data.capital.receivables -
                  data.capital.inventory,
              },
            ]}
          />
          <EvidenceBars
            title="Finanzierung am Stichtag"
            rows={[
              { label: "Eigenkapital", value: data.balance.totals.equity },
              { label: "Langfristiges Fremdkapital", value: data.balance.totals.longLiabilities },
              {
                label: "Kurzfristiges Fremdkapital",
                value: data.balance.totals.currentLiabilities,
              },
            ]}
          />
        </div>
        <div className="report-fact-line">
          <span>
            {t("Bilanzsumme")} <strong>{money(data.balance.totals.assets)}</strong>
          </span>
          <span>
            {t("Eigenkapitalquote")}{" "}
            <strong>{formatValue(data.balance.equityRatio, "percent")}</strong>
          </span>
          <span>
            {t("Nettofinanzschulden")} <strong>{money(data.balance.netDebt)}</strong>
          </span>
        </div>
        <figure className="report-figure">
          <figcaption>{t("Historischer Cashflow: vom Anfangs- zum Endbestand")}</figcaption>
          <CashflowBridge stages={data.cash.bridge} />
        </figure>
        <div className="report-fact-line">
          <span>
            {t("Free Cashflow")} <strong>{money(data.cash.freeCashflow)}</strong>
          </span>
          <span>
            {t("Working-Capital-Effekt")}{" "}
            <strong>{formatDelta(data.cash.workingCapitalEffect, "currency")}</strong>
          </span>
        </div>
        <p>
          {t(
            "Der Working-Capital-Effekt zeigt die Cash-Wirkung aus Forderungen, Vorräten und Lieferverbindlichkeiten. Ein positiver Wert setzt Cash frei. Free Cashflow entspricht operativem Cashflow plus Investitions-Cashflow.",
          )}
        </p>
        {includeRisks && (
          <>
            <EvidenceBars title="Forderungsalter: offene Rechnungsbeträge" rows={data.aging} />
            <p>
              {t(
                "Die Altersklassen ergeben zusammen die bilanziellen Forderungen. Überfällig bedeutet noch keinen bestätigten Zahlungsausfall.",
              )}
            </p>
          </>
        )}
      </section>
    </>
  );
}
export function ReportForecast({ data }: { data: Analysis }) {
  const { t } = useTranslation();
  return (
    <div className="report-forecast-evidence">
      <EvidenceBars
        title="Vorschau: Endbestand der liquiden Mittel"
        rows={data.forecast.map((m) => ({ label: `${t(m.month)} 2026`, value: m.closing }))}
      />
      <div className="report-fact-line">
        <span>
          {t("Sitzungsziel Mindestbestand")} <strong>{money(data.cashFloor)}</strong>
        </span>
        <span>
          {t("Niedrigster Monatsendbestand")} <strong>{money(data.lowest.closing)}</strong> ·{" "}
          {t(data.lowest.month)}
        </span>
        <span>
          {t("Abstand zum Mindestbestand")}{" "}
          <strong>{formatDelta(data.minimumHeadroom, "currency")}</strong>
        </span>
      </div>
      <p>
        {t(
          data.minimumHeadroom >= 0
            ? "Alle prognostizierten Monatsendbestände erreichen den Mindestbestand. Untermonatige Engpässe sind damit nicht ausgeschlossen."
            : "Mindestens ein prognostizierter Monatsendbestand unterschreitet den Mindestbestand. Zahlungsplanung und Finanzierung prüfen.",
        )}
      </p>
      <table className="data-table report-data-table">
        <caption className="sr-only">{t("Zahlungsannahmen der Liquiditätsvorschau")}</caption>
        <thead>
          <tr>
            {["Monat", "Einzahlungen", "Auszahlungen", "Netto-Cashflow"].map((h) => (
              <th key={h}>{t(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.forecast.map((m) => (
            <tr key={m.month}>
              <th>{t(m.month)}</th>
              <td>{money(m.receipts)}</td>
              <td>{money(m.payments)}</td>
              <td>{formatDelta(m.net, "currency")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
