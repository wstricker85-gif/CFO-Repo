"use client";
import { useTranslation } from "@/components/i18n/Language";
import Link from "next/link";
import { useState } from "react";
import { getBalanceStatement } from "@/lib/statements";
import { formatCompactCurrency, formatDate, formatDelta, formatValue } from "@/lib/format";
import { downloadCsv } from "@/lib/export";
import { useDemo } from "@/components/shared/DemoProvider";
import { ModulePage, Panel } from "@/components/shared/ModulePage";
import { SummaryStat } from "@/components/shared/Visuals";
import { StatementControls } from "@/components/shared/StatementControls";
import { StatementAnalysis } from "@/components/shared/StatementAnalysis";
import { StatementTable } from "@/components/shared/StatementTable";

export function BalanceSheet() {
  const { t } = useTranslation();

  const { period } = useDemo();
  const [comparison, setComparison] = useState<"prior" | "opening">("prior");
  const [details, setDetails] = useState(true),
    [scale, setScale] = useState<"eur" | "thousand">("thousand");
  const result = getBalanceStatement(period, comparison);
  const { current, previous, totals } = result;
  const assetRows = details ? result.assets : result.assets.filter((r) => r.kind !== "detail");
  const liabilityRows = details
    ? result.liabilities
    : result.liabilities.filter((r) => r.kind !== "detail");
  const selectedDate = formatDate(current.date),
    priorDate = formatDate(previous.date);
  function exportBalance() {
    downloadCsv(`Bilanz-Demo-${period}.csv`, [
      ["DEMO-BILANZ – Mittelstand GmbH", current.date, previous.date],
      ["Seite", "Position", "Stichtag EUR", "Vergleich EUR", "Veränderung EUR"],
      ...result.assets.map((r) => ["Aktiva", r.label, r.value, r.previous, r.value - r.previous]),
      ...result.liabilities.map((r) => [
        "Passiva",
        r.label,
        r.value,
        r.previous,
        r.value - r.previous,
      ]),
      ["Kontrolle", "Aktiva minus Passiva", result.difference],
    ]);
  }
  return (
    <ModulePage
      eyebrow={t("Bilanz")}
      title={
        <>
          {t(" Vermögen und Finanzierung. ")}
          <em>{t("Im Gleichgewicht.")}</em>
        </>
      }
      description={t(
        "Aktiva und Passiva mit Stichtagsvergleich, Kapitalstruktur und Analyse der Mittelbindung.",
      )}
      context={t("Bilanz · Stichtagswerte")}
      action={
        <button className="button" onClick={exportBalance}>
          {t(" Bilanz exportieren ↗ ")}
        </button>
      }
    >
      <div className="balance-comparison">
        <div className="filter-pills" role="group" aria-label={t("Vergleichsstichtag der Bilanz")}>
          <button aria-pressed={comparison === "prior"} onClick={() => setComparison("prior")}>
            {t(" Zum Vormonat ")}
          </button>
          <button aria-pressed={comparison === "opening"} onClick={() => setComparison("opening")}>
            {t(" Zum 31.12.2025 ")}
          </button>
        </div>
        <span className="small-muted">
          {t(selectedDate)} {t(" gegenüber ")}
          {t(priorDate)}
        </span>
      </div>
      <p className="inline-note">
        <Link href="/ifrs">
          {t(" HGB → IFRS: Auswirkungen ausgewählter Bilanzierungsunterschiede untersuchen ↗ ")}
        </Link>
      </p>
      <StatementControls
        scale={scale}
        setScale={setScale}
        details={details}
        setDetails={setDetails}
      />
      <div className="summary-grid">
        <SummaryStat
          label={"Bilanzsumme"}
          value={formatCompactCurrency(totals.assets)}
          detail={t(`${formatDelta(result.assetChange, "currency")} gegenüber ${priorDate}`)}
        />
        <SummaryStat
          label={"Eigenkapitalquote"}
          value={formatValue(result.equityRatio, "percent")}
          detail={t(`${formatCompactCurrency(totals.equity)} Eigenkapital`)}
        />
        <SummaryStat
          label={"Anlagendeckung II"}
          value={formatValue(result.assetCoverage, "percent")}
          detail={t("Langfristiges Kapital im Verhältnis zum Anlagevermögen")}
        />
        <SummaryStat
          label={"Nettofinanzschulden"}
          value={formatCompactCurrency(result.netDebt)}
          detail={t("Kurz- und langfristige Finanzschulden abzüglich Cash")}
        />
      </div>
      <StatementAnalysis
        title={t("Was die Bilanz über den finanziellen Spielraum zeigt")}
        points={[
          {
            label: "Kapitalbindung",
            text: `${formatCompactCurrency(result.workingAssets)} sind in Forderungen und Vorräten gebunden. Das operative Net Working Capital verändert sich gegenüber ${priorDate} um ${formatDelta(result.workingCapitalChange, "currency")}.`,
          },
          {
            label: "Finanzierungsstruktur",
            text: `${formatValue(result.equityRatio, "percent")} der Bilanzsumme sind durch Eigenkapital finanziert. Finanzschulden betragen ${formatCompactCurrency(result.grossDebt)}, davon ${formatCompactCurrency(current.shortDebt)} kurzfristig.`,
          },
          {
            label: "Ergebnisverknüpfung",
            text: `Das kumulierte Ergebnis nach Steuern von ${formatCompactCurrency(current.ytdNetIncome)} erhöht das Eigenkapital. Es gibt in der Demo keine Ausschüttungen oder Kapitaleinlagen; der Gewinn wird vollständig einbehalten.`,
          },
        ]}
      />
      <Panel
        index="01 / Vermögens- und Kapitalstruktur"
        title={t("Worin Mittel stecken – und woher sie kommen")}
      >
        <div className="balance-structure">
          {[
            {
              title: "Aktiva",
              total: totals.assets,
              rows: [
                {
                  label: "Anlagevermögen",
                  value: totals.noncurrentAssets,
                  color: "var(--series-1)",
                },
                { label: "Vorräte", value: current.inventory, color: "var(--series-2)" },
                {
                  label: "Forderungen & sonstige Werte",
                  value: current.receivables + current.otherCurrentAssets,
                  color: "var(--series-3)",
                },
                { label: "Liquide Mittel", value: current.cash, color: "var(--series-4)" },
              ],
            },
            {
              title: "Passiva",
              total: totals.liabilities,
              rows: [
                { label: "Eigenkapital", value: totals.equity, color: "var(--series-1)" },
                {
                  label: "Langfristiges Fremdkapital",
                  value: totals.longLiabilities,
                  color: "var(--series-2)",
                },
                {
                  label: "Kurzfristiges Fremdkapital",
                  value: totals.currentLiabilities,
                  color: "var(--series-3)",
                },
              ],
            },
          ].map((side) => (
            <div key={side.title}>
              <div className="balance-structure-heading">
                <strong>{t(side.title)}</strong>
                <span>{t(formatCompactCurrency(side.total))}</span>
              </div>
              <div
                className="balance-stack"
                role="img"
                aria-label={t(
                  `${side.title}: ${side.rows.map((r) => `${r.label} ${formatValue((r.value / side.total) * 100, "percent")}`).join(", ")}`,
                )}
              >
                {side.rows.map((r) => (
                  <span
                    key={r.label}
                    style={{ width: `${(r.value / side.total) * 100}%`, background: r.color }}
                  />
                ))}
              </div>
              <dl className="balance-structure-legend">
                {side.rows.map((r) => (
                  <div key={r.label}>
                    <dt>
                      <i style={{ background: r.color }} />
                      {t(r.label)}
                    </dt>
                    <dd>{t(formatValue((r.value / side.total) * 100, "percent"))}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </Panel>
      <div className="balance-tables">
        <Panel
          index="02 / Aktiva"
          title={t("Vermögensseite")}
          action={<span className="panel-period">{t(scale === "eur" ? "EUR" : "Tsd. €")}</span>}
        >
          <StatementTable
            rows={assetRows}
            comparisonKey="previous"
            comparisonLabel={t(priorDate)}
            periodLabel={t(selectedDate)}
            total={totals.assets}
            scale={scale}
          />
        </Panel>
        <Panel
          index="03 / Passiva"
          title={t("Finanzierungsseite")}
          action={<span className="panel-period">{t(scale === "eur" ? "EUR" : "Tsd. €")}</span>}
        >
          <StatementTable
            rows={liabilityRows}
            comparisonKey="previous"
            comparisonLabel={t(priorDate)}
            periodLabel={t(selectedDate)}
            total={totals.liabilities}
            scale={scale}
          />
        </Panel>
      </div>
      <div className="statement-reconciliation">
        <span className="status" data-status="good">
          <span className="status-dot" />
          {t(" Bilanz ausgeglichen ")}
        </span>
        <span>
          {t("Aktiva − Passiva: ")}
          {t(formatValue(result.difference, "currency"))}
        </span>
        <span>{t("Exakte Cent-Abstimmung · Anzeige gerundet")}</span>
      </div>
      <div className="statement-links">
        <Link href="/guv">{t("Jahresergebnis in der GuV ansehen ↗")}</Link>
        <Link href="/cashflow">{t("Bestandsänderungen im Cashflow nachvollziehen ↗")}</Link>
      </div>
      <div className="methodology-note">
        <strong>{t("Bilanz der Beispielgesellschaft")}</strong>
        <p>
          {t(
            " Managementgliederung nach Fristigkeit mit ausgewählten Abschlusspositionen, kein vollständiger gesetzlicher Jahresabschluss. Der Stichtag ist vom GuV-Zeitraum zu unterscheiden. Bilanz und Cashflow stammen aus derselben fiktiven Monatsabschlussreihe; Forderungen und Cash stimmen mit den bestehenden Modulen überein. Veränderungen einzelner Bilanzpositionen sind für sich genommen weder positiv noch negativ bewertet. ",
          )}
        </p>
      </div>
    </ModulePage>
  );
}
