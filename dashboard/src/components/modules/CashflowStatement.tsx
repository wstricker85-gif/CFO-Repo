"use client";
import { useTranslation } from "@/components/i18n/Language";
import Link from "next/link";
import { useState } from "react";
import { getCashflowStatement, type StatementLine } from "@/lib/statements";
import { formatCompactCurrency, formatDate, formatDelta, formatValue } from "@/lib/format";
import { downloadCsv } from "@/lib/export";
import { useDemo } from "@/components/shared/DemoProvider";
import { ModulePage, Panel } from "@/components/shared/ModulePage";
import { SummaryStat } from "@/components/shared/Visuals";
import { StatementControls } from "@/components/shared/StatementControls";
import { StatementAnalysis } from "@/components/shared/StatementAnalysis";
import { StatementTable } from "@/components/shared/StatementTable";
import { CashflowBridge } from "@/components/shared/CashflowBridge";

export function CashflowStatement() {
  const { t } = useTranslation();

  const { period, snapshot } = useDemo();
  const [ytd, setYtd] = useState(false),
    [details, setDetails] = useState(true),
    [scale, setScale] = useState<"eur" | "thousand">("thousand");
  const result = getCashflowStatement(period, ytd);
  const totalRow = (
    id: string,
    label: string,
    value: number,
    description: string,
  ): StatementLine => ({ id, label, value, description, kind: "subtotal" });
  const sections = [
    {
      id: "01",
      title: "Cashflow aus laufender Geschäftstätigkeit",
      short: "Operativ",
      value: result.operating,
      rows: result.operatingRows,
      description:
        "Indirekte Überleitung vom Ergebnis nach Steuern über nicht zahlungswirksame Aufwendungen und operative Bilanzveränderungen.",
    },
    {
      id: "02",
      title: "Cashflow aus Investitionstätigkeit",
      short: "Investitionen",
      value: result.investing,
      rows: result.investingRows,
      description:
        "Auszahlungen für Sachanlagen. Keine Anlagenverkäufe oder Finanzanlagebewegungen in der Demo.",
    },
    {
      id: "03",
      title: "Cashflow aus Finanzierungstätigkeit",
      short: "Finanzierung",
      value: result.financing,
      rows: result.financingRows,
      description:
        "Zahlungswirksame Nettoänderung der Finanzschulden. Keine Ausschüttungen oder Einlagen.",
    },
  ];
  function exportCashflow() {
    downloadCsv(`Cashflow-Demo-${period}-${ytd ? "YTD" : "Monat"}.csv`, [
      ["DEMO-CASHFLOW – indirekte Methode", result.openingDate, result.end],
      ["Bereich", "Position", "EUR"],
      ...sections.flatMap((section) => [
        ...section.rows.map((r) => [section.short, r.label, r.value]),
        [section.short, section.title, section.value],
      ]),
      ["Überleitung", "Anfangsbestand", result.openingCash],
      ["Überleitung", "Veränderung liquide Mittel", result.cashChange],
      ["Überleitung", "Endbestand", result.closingCash],
      ["Ergänzung – bereits operativ enthalten", "Gezahlte Zinsen", result.interestPaid],
      ["Ergänzung – bereits operativ enthalten", "Gezahlte Ertragsteuern", result.taxesPaid],
    ]);
  }
  return (
    <ModulePage
      eyebrow={t("Cashflow")}
      title={
        <>
          {t(" Vom Ergebnis zur Liquidität. ")}
          <em>{t("Jede Bewegung zählt.")}</em>
        </>
      }
      description={t(
        "Indirekte Kapitalflussrechnung mit operativen, Investitions- und Finanzierungsbeiträgen sowie Analyse.",
      )}
      context={t(ytd ? "Cashflow · Januar bis Stichtag" : "Cashflow · Monatswerte")}
      action={
        <button className="button" onClick={exportCashflow}>
          {t(" Cashflow exportieren ↗ ")}
        </button>
      }
    >
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
          label={"Operativer Cashflow"}
          value={formatCompactCurrency(result.operating)}
          detail={t("Nach modellierten Zins- und Ertragsteuerzahlungen")}
        />
        <SummaryStat
          label={"Free Cashflow"}
          value={formatCompactCurrency(result.freeCashflow)}
          detail={t("Operativer Cashflow plus Investitions-Cashflow")}
        />
        <SummaryStat
          label={"Veränderung liquide Mittel"}
          value={formatDelta(result.cashChange, "currency")}
          detail={t(`${formatDate(result.openingDate)} bis ${formatDate(result.end)}`)}
        />
        <SummaryStat
          label={"Endbestand liquide Mittel"}
          value={formatCompactCurrency(result.closingCash)}
          detail={t("Identisch zu Bilanz und Übersicht am Stichtag")}
        />
      </div>
      <StatementAnalysis
        title={t("Warum Gewinn und Bankbestand nicht gleich laufen")}
        points={[
          {
            label: "Ergebnis wird Cash",
            text: `Aus ${formatCompactCurrency(result.netIncome)} Ergebnis nach Steuern entstehen ${formatCompactCurrency(result.operating)} operativer Cashflow. Das entspricht ${formatValue(result.cashConversion, "percent")} des EBITDA; Bestandsänderungen und Rückstellungen beeinflussen diese Quote.`,
          },
          {
            label: "Working Capital wirkt",
            text: `Forderungen, Vorräte und Lieferverbindlichkeiten tragen zusammen ${formatDelta(result.workingCapitalEffect, "currency")} zum Cashflow bei. ${result.workingCapitalEffect < 0 ? "Der Saldo bindet Liquidität." : result.workingCapitalEffect > 0 ? "Der Saldo setzt Liquidität frei." : "Der Saldo ist cashneutral."}`,
          },
          {
            label: "Investieren und finanzieren",
            text: `Nach ${formatCompactCurrency(Math.abs(result.investing))} Investitionen verbleiben ${formatCompactCurrency(result.freeCashflow)} Free Cashflow. Die Finanzierung verändert die Mittel um ${formatDelta(result.financing, "currency")}; insgesamt ${formatDelta(result.cashChange, "currency")}.`,
          },
        ]}
      />
      <Panel
        index="01 / Liquiditätsbrücke"
        title={t("Vom Anfangsbestand zum Endbestand")}
        action={
          <span className="panel-period">
            {t(ytd ? "YTD · " : "")}
            {t(snapshot.label)}
          </span>
        }
      >
        <CashflowBridge stages={result.bridge} />
        <div className="chart-footer">
          <span>
            <i className="legend-actual" />
            {t(" Bestände ")}
          </span>
          <span>
            <i className="legend-flow-in" />
            {t(" Zufluss ")}
          </span>
          <span>
            <i className="legend-flow-out" />
            {t(" Abfluss ")}
          </span>
        </div>
      </Panel>
      <div className="cashflow-statements">
        {sections.map((section) => (
          <Panel
            key={section.id}
            index={`${Number(section.id) + 1 < 10 ? "0" : ""}${Number(section.id) + 1} / ${section.short}`}
            title={t(section.title)}
            action={<span className="panel-period">{t(scale === "eur" ? "EUR" : "Tsd. €")}</span>}
          >
            <StatementTable
              rows={[
                ...(details ? section.rows : []),
                totalRow(`total-${section.id}`, section.title, section.value, section.description),
              ]}
              periodLabel={t(`${ytd ? "YTD · " : ""}${snapshot.label}`)}
              scale={scale}
            />
            <div className="panel-note">{t(section.description)}</div>
          </Panel>
        ))}
      </div>
      <Panel index="05 / Bestandsabstimmung" title={t("Die Rechnung schließt mit der Bilanz")}>
        <div className="cash-reconciliation-grid">
          <div>
            <span className="label">{t("Anfangsbestand")}</span>
            <strong>{t(formatCompactCurrency(result.openingCash))}</strong>
            <span>{t(formatDate(result.openingDate))}</span>
          </div>
          <span aria-hidden="true">+</span>
          <div>
            <span className="label">{t("Summe der Cashflows")}</span>
            <strong>{t(formatDelta(result.cashChange, "currency"))}</strong>
            <span>{t("Operativ + Investition + Finanzierung")}</span>
          </div>
          <span aria-hidden="true">=</span>
          <div>
            <span className="label">{t("Endbestand")}</span>
            <strong>{t(formatCompactCurrency(result.closingCash))}</strong>
            <span>{t(formatDate(result.end))}</span>
          </div>
        </div>
        <div className="statement-reconciliation panel-reconciliation">
          <span className="status" data-status="good">
            <span className="status-dot" />
            {t(" Mit der Bilanz abgestimmt ")}
          </span>
          <span>
            {t("Abstimmungsdifferenz: ")}
            {t(formatValue(result.reconciliation, "currency"))}
          </span>
        </div>
      </Panel>
      <Panel
        index="06 / Ergänzende Zahlungsangaben"
        title={t("Zinsen und Steuern sind bereits enthalten")}
      >
        <div className="cashflow-paid">
          <div>
            <span>{t("Gezahlte Zinsen")}</span>
            <strong>{t(formatValue(result.interestPaid, "currency"))}</strong>
          </div>
          <div>
            <span>{t("Gezahlte Ertragsteuern")}</span>
            <strong>{t(formatValue(result.taxesPaid, "currency"))}</strong>
          </div>
        </div>
        <div className="panel-note">
          {t(
            " Demo-Konvention: Zinsen und Ertragsteuern werden operativ klassifiziert. Zinsaufwand wird im selben Monat gezahlt. Steuerzahlung = Steueraufwand minus Zunahme der Ertragsteuerverbindlichkeiten. Diese Angaben nicht erneut von den Cashflow-Summen abziehen. ",
          )}
        </div>
      </Panel>
      <div className="statement-links">
        <Link href="/guv">{t("Ausgangsergebnis in der GuV ansehen ↗")}</Link>
        <Link href="/bilanz">{t("Bankbestand und Bestandsänderungen prüfen ↗")}</Link>
        <Link href="/working-capital">{t("Kurzfristigen Cash-Forecast ansehen ↗")}</Link>
      </div>
      <div className="methodology-note">
        <strong>{t("Indirekte Kapitalflussrechnung der Demo")}</strong>
        <p>
          {t(
            " Historische fiktive Monatsabschlüsse, keine Prognose. Keine Währungsumrechnung, Akquisitionen, Anlagenverkäufe, Leasing-Neuzugänge oder sonstigen nicht zahlungswirksamen Finanzierungsbewegungen modelliert. Free Cashflow ist hier operativer Cashflow plus Investitions-Cashflow; die Definition unterscheidet sich vom unverschuldeten Bewertungs-FCF im DCF-Modell. Keine testierte Kapitalflussrechnung nach einem bestimmten Rechnungslegungsstandard. ",
          )}
        </p>
      </div>
    </ModulePage>
  );
}
