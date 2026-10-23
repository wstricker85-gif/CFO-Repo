"use client";
import { Select } from "@/components/ui/Select";
import { getLocale } from "@/lib/i18n";
import { useTranslation } from "@/components/i18n/Language";
import Link from "next/link";
import { useState } from "react";
import {
  getIfrsBridge,
  ifrsDefaults,
  ifrsSources,
  accounts,
  type IfrsOptions,
  type BridgeRow,
  type JournalEntry,
} from "@/lib/ifrs";
import {
  formatCompactCurrency,
  formatDelta,
  formatValue,
  formatStatementAmount,
  formatDate,
} from "@/lib/format";
import { downloadCsv } from "@/lib/export";
import { useDemo } from "@/components/shared/DemoProvider";
import { ModulePage, Panel } from "@/components/shared/ModulePage";
import { SummaryStat } from "@/components/shared/Visuals";
import { CashflowBridge } from "@/components/shared/CashflowBridge";
import { MetricInfo } from "@/components/ui/MetricInfo";
export function IfrsBridge() {
  const { t } = useTranslation();

  const { period, snapshot } = useDemo();
  const [options, setOptions] = useState<IfrsOptions>({ ...ifrsDefaults });
  const [view, setView] = useState<"balance" | "income">("balance");
  const [ytd, setYtd] = useState(true);
  const [scale, setScale] = useState<"eur" | "thousand">("thousand");
  const result = getIfrsBridge(period, options, ytd);
  const rows = view === "balance" ? result.balanceRows : result.incomeRows;
  const periodLabel = ytd ? `Januar bis ${snapshot.label}` : snapshot.label;
  const cards = [
    {
      label: "Eigenkapital IFRS-Demo",
      row: result.equity,
      basis: `Stichtag ${formatDate(result.end)}`,
      definition:
        "HGB-Eigenkapital zuzüglich kumulierter Ergebniswirkungen seit Januar einschließlich latenter Steuern.",
    },
    {
      label: "Bilanzsumme IFRS-Demo",
      row: result.assets,
      basis: `Stichtag ${formatDate(result.end)}`,
      definition:
        "HGB-Bilanzsumme zuzüglich Nutzungsrecht, Entwicklungsvermögenswert und aktiver latenter Steuern. Aktive und passive latente Steuern werden hier brutto dargestellt.",
    },
    {
      label: "EBITDA IFRS-Demo",
      row: result.ebitda,
      basis: periodLabel,
      definition:
        "Demo-Managementkennzahl: Mietaufwand wird zurückgenommen, qualifizierende Entwicklungskosten werden aktiviert. Der höhere Wert bedeutet keinen zusätzlichen Zahlungseingang.",
    },
    {
      label: "Ergebnis IFRS-Demo",
      row: result.net,
      basis: periodLabel,
      definition:
        "Ergebnis nach den aktivierten Anpassungen und ihren latenten Steuerwirkungen. Laufende Steuern bleiben gemäß HGB-Demo unverändert.",
    },
  ];
  function exportBridge() {
    downloadCsv(`HGB-IFRS-Demo-${period}-${ytd ? "YTD" : "Monat"}.csv`, [
      ["VEREINFACHTE DEMO-ÜBERLEITUNG – keine vollständige IFRS-Rechnung", snapshot.label],
      [
        "Leasing aktiv",
        options.lease ? "Ja" : "Nein",
        "Entwicklung aktiv",
        options.development ? "Ja" : "Nein",
      ],
      ["Latente Steuern", "Automatisch 30 %; Bruttoausweis", "GuV-Zeitraum", periodLabel],
      [
        "Darstellung",
        "Position",
        "HGB EUR",
        "Leasing EUR",
        "Entwicklung EUR",
        "Latente Steuern EUR",
        "IFRS-Demo EUR",
      ],
      ...result.balanceRows.map((r) => [
        "Bilanz Stichtag",
        r.label,
        r.hgb,
        r.lease,
        r.development,
        r.tax,
        r.ifrs,
      ]),
      ...result.incomeRows.map((r) => [
        "GuV " + periodLabel,
        r.label,
        r.hgb,
        r.lease,
        r.development,
        r.tax,
        r.ifrs,
      ]),
      ["Kontrolle", "Aktiva minus Passiva EUR", result.difference],
      [],
      [
        "Anpassungsjournal seit 01.01.2026 inkl. Erstansatz",
        "Monat",
        "Soll",
        "Haben",
        "Betrag EUR",
      ],
      ...result.journal.map((e) => [
        e.label,
        e.month === 0 ? "Erstansatz 01.01." : `2026-${String(e.month).padStart(2, "0")}`,
        accounts[e.debit],
        accounts[e.credit],
        e.amount,
      ]),
    ]);
  }
  return (
    <ModulePage
      eyebrow={t("HGB → IFRS")}
      title={
        <>
          {t(" Zwei Perspektiven. ")}
          <em>{t("Eine Überleitung.")}</em>
        </>
      }
      description={t(
        "Bilanzierungsunterschiede verstehen und ihre Wirkung auf Vermögen, Eigenkapital und Ergebnis verfolgen.",
      )}
      context={t("Bilanz: Stichtag · GuV: Monat oder YTD")}
      action={
        <button className="button" onClick={exportBridge}>
          {t(" Überleitung exportieren ↗ ")}
        </button>
      }
    >
      <div className="ifrs-scope">
        <span className="label">{t("Vereinfachte Demo · Berichtsjahr 2026")}</span>
        <p>
          {t(
            " Der bestehende Demoabschluss dient hier als HGB-Ausgangsbasis. Zwei ausgewählte Beispielfälle ergänzen eine IFRS-Perspektive; latente Steuern folgen automatisch. Keine vollständige IFRS-Erstanwendung nach IFRS 1. Die übrigen Dashboard-Ansichten zeigen weiterhin den unveränderten Ausgangsabschluss. ",
          )}
        </p>
      </div>
      <div className="module-toolbar">
        <div className="filter-pills" role="group" aria-label={t("GuV-Zeitraum der Überleitung")}>
          <button aria-pressed={ytd} onClick={() => setYtd(true)}>
            {t(" Januar bis Stichtag ")}
          </button>
          <button aria-pressed={!ytd} onClick={() => setYtd(false)}>
            {t(" Berichtsmonat ")}
          </button>
        </div>
        <Link className="text-link" href="/annahmen">
          {t(" Annahmen & Ziele ↗ ")}
        </Link>
      </div>
      <div className="summary-grid" aria-live="polite">
        {cards.map((c) => (
          <SummaryStat
            key={c.label}
            label={c.label}
            value={formatCompactCurrency(c.row.ifrs)}
            detail={t(`${formatDelta(c.row.delta, "currency")} zu HGB · ${c.basis}`)}
            insight={{
              title: c.label,
              definition: c.definition,
              analysis: `HGB ${formatValue(c.row.hgb, "currency")}; Anpassung ${formatDelta(c.row.delta, "currency")}; IFRS-Demo ${formatValue(c.row.ifrs, "currency")}. ${c.basis}.`,
              sourceLabel: `${snapshot.label} · Fiktives Überleitungsjournal`,
              caveat: "Bilanzierungseffekt; keine automatische wirtschaftliche Verbesserung.",
            }}
          />
        ))}
      </div>
      <Panel
        index="01 / Beispielfälle"
        title={t("Die Perspektive verändern")}
        action={
          <button className="text-button" onClick={() => setOptions({ ...ifrsDefaults })}>
            {t(" Demo zurücksetzen ↺ ")}
          </button>
        }
      >
        <div className="ifrs-case-grid">
          <article className="ifrs-case">
            <label className="ifrs-case-toggle">
              <input
                type="checkbox"
                checked={options.lease}
                onChange={(e) => setOptions({ ...options, lease: e.target.checked })}
              />
              <span>
                <strong>{t("Leasing")}</strong>
                <small>{t("IFRS 16 · Nutzungsrecht und Schuld")}</small>
              </span>
            </label>
            <p>
              {t(
                " Der Mietaufwand wird durch Abschreibung und Zins ersetzt. Das EBITDA steigt, der Kontostand bleibt gleich. ",
              )}
            </p>
            <span className="ifrs-case-value">
              {t(options.lease ? formatCompactCurrency(result.closing.lease) : "Nicht einbezogen")}
            </span>
            <span className="small-muted">{t("Leasingverbindlichkeit zum Stichtag")}</span>
          </article>
          <article className="ifrs-case">
            <label className="ifrs-case-toggle">
              <input
                type="checkbox"
                checked={options.development}
                onChange={(e) => setOptions({ ...options, development: e.target.checked })}
              />
              <span>
                <strong>{t("Entwicklungskosten")}</strong>
                <small>{t("IAS 38 · Qualifizierendes Projekt")}</small>
              </span>
            </label>
            <p>
              {t(
                " Im HGB-Fall vollständig als Aufwand erfasst. Im IFRS-Fall wird ein Entwicklungsvermögenswert angesetzt. ",
              )}
            </p>
            <span className="ifrs-case-value">
              {t(
                options.development
                  ? formatCompactCurrency(result.closing.development)
                  : "Nicht einbezogen",
              )}
            </span>
            <span className="small-muted">{t("Aktivierte Entwicklung seit Januar")}</span>
          </article>
          <article data-metric-hover="" className="ifrs-case ifrs-case-automatic">
            <div className="ifrs-case-toggle">
              <span className="ifrs-auto-icon" aria-hidden="true">
                ↳
              </span>
              <div>
                <div className="ifrs-tax-title">
                  <strong>{t("Latente Steuern")}</strong>
                  <MetricInfo
                    insight={{
                      title: "Was sind latente Steuern?",
                      analysis:
                        "Manche Aufwendungen oder Erträge zählen im Abschluss und für die Steuer zu unterschiedlichen Zeitpunkten. Latente Steuern zeigen die künftige Steuerwirkung dieser vorübergehenden Unterschiede: aktiv = erwartete Steuerentlastung, passiv = erwartete Steuerbelastung. Daraus entsteht heute noch keine Steuerzahlung.",
                      definition:
                        "Einfaches Demo-Beispiel: 10.000 € Entwicklungskosten werden steuerlich sofort abgezogen, im IFRS-Abschluss aber als Vermögenswert erfasst und erst später abgeschrieben. Bei 30 % entstehen 3.000 € passive latente Steuern. Sie bilden ab, dass der steuerliche Abzug bereits verbraucht ist, während die künftige IFRS-Abschreibung noch folgt.",
                      formula: "Temporäre Differenz × maßgeblicher Steuersatz; in dieser Demo 30 %",
                      caveat:
                        "Aktive latente Steuern dürfen nur angesetzt werden, wenn die Voraussetzungen erfüllt sind. Die Demo unterstellt ausreichende künftige steuerliche Ergebnisse. Dauerhafte Unterschiede werden hier nicht als latente Steuern erfasst.",
                      sourceLabel: "IAS 12 · Vereinfachte Erklärung · Demo-Annahmen",
                    }}
                  />
                </div>
                <small>{t("IAS 12 · Automatisch gekoppelt")}</small>
              </div>
            </div>
            <p>
              {t(
                " Heute anders bilanziert, später steuerlich wirksam: Latente Steuern bilden die künftige Steuerentlastung oder -belastung ab. Das Info-Symbol erklärt den Unterschied mit einem einfachen Beispiel. ",
              )}
            </p>
            <span className="ifrs-case-value">30 %</span>
            <span className="small-muted">{t("Fiktiver Steuersatz · kein Steuerschalter")}</span>
          </article>
        </div>
        <p className="panel-note">
          {t(
            " Schalter wählen den Umfang des Beispiels, kein Bilanzierungswahlrecht unter IFRS. Ergebniswirkungen sind Bewertungs- und Darstellungseffekte; die Zahlungen bleiben unverändert. ",
          )}
        </p>
      </Panel>
      <Panel
        index="02 / Eigenkapitalbrücke"
        title={t("Vom HGB- zum IFRS-Eigenkapital")}
        action={<span className="panel-period">{t("Kumuliert seit 01.01.2026")}</span>}
      >
        <CashflowBridge
          stages={result.stages}
          title={t("Überleitung vom HGB- zum IFRS-Demo-Eigenkapital")}
          description={t(
            "Die kumulierten Leasing-, Entwicklungs- und Steueranpassungen überleiten das Eigenkapital zum Stichtag.",
          )}
          regionLabel={t("Eigenkapitalbrücke, horizontal scrollbar")}
        />
        <div className="ifrs-reconciliation" role="status">
          <span>{t("Bilanzkontrolle: Aktiva − Passiva")}</span>
          <strong>{t(formatValue(result.difference, "currency"))}</strong>
          <span>
            {t(" Zusätzliche Veränderung liquider Mittel: ")}
            {t(formatValue(result.cashChange, "currency"))}
          </span>
        </div>
      </Panel>
      <Panel index="03 / Überleitung" title={t("Jede Anpassung nachvollziehen")}>
        <div className="module-toolbar ifrs-table-controls">
          <div className="filter-pills" role="group" aria-label={t("Abschluss der Überleitung")}>
            <button aria-pressed={view === "balance"} onClick={() => setView("balance")}>
              {t(" Bilanz zum Stichtag ")}
            </button>
            <button aria-pressed={view === "income"} onClick={() => setView("income")}>
              {t(" GuV · ")}
              {t(ytd ? "YTD" : "Monat")}
            </button>
          </div>
          <label className="select-control">
            {t(" Einheit ")}
            <Select value={scale} onChange={(e) => setScale(e.target.value as "eur" | "thousand")}>
              <option value="thousand">{t("Tsd. €")}</option>
              <option value="eur">{t("EUR")}</option>
            </Select>
          </label>
        </div>
        <BridgeTable
          rows={rows}
          scale={scale}
          basis={view === "balance" ? `Stichtag ${formatDate(result.end)}` : periodLabel}
        />
        <div className="table-note">
          <span>
            {t(
              " IFRS-Demo = HGB + Leasing + Entwicklung + latente Steuern. Aufwendungen sind in der GuV negativ. ",
            )}
          </span>
          <span>
            {t(
              view === "balance"
                ? "Eigenkapital enthält immer die kumulierte Ergebniswirkung."
                : periodLabel,
            )}
          </span>
        </div>
      </Panel>
      <Panel index="04 / Buchungen & Methodik" title={t("Was hinter der Überleitung steht")}>
        <div className="ifrs-methods">
          <details className="metric-details">
            <summary>{t("Leasing · Annahmen und Buchungen")}</summary>
            <p>
              {t(
                " Leasingnehmer, Vertragsbeginn 01.01.2026, 60 nachschüssige Monatsraten zu 12.000 €. Diskontierung mit 0,5 % je Monat (nominal 6 % p. a.); keine Vorauszahlungen, Anreize, Zusatzkosten oder Ausnahmen. Anfangsbarwert",
              )}
              {t(" ")}
              {t(formatValue(result.initialLease, "currency"))}
              {t("; lineare monatliche Abschreibung")}
              {t(" ")}
              {t(formatValue(result.monthlyDepreciation, "currency"))}{" "}
              {t(
                " über 60 Monate. Das HGB-Beispiel unterstellt wirtschaftliches Eigentum beim Leasinggeber und enthält die Monatsrate bereits im sonstigen Aufwand. ",
              )}
            </p>
            <p>
              {t(
                " Die Anpassung „Leasingverbindlichkeit an Mietaufwand“ ersetzt den bereits gebuchten Mietaufwand. Zins und Abschreibung folgen separat; die Bankbuchung wird nicht verdoppelt. ",
              )}
            </p>
            <JournalTable
              entries={result.journal.filter(
                (e) =>
                  e.group === "lease" &&
                  (ytd || e.month === Number(period.slice(5)) || e.month === 0),
              )}
            />
          </details>
          <details className="metric-details">
            <summary>{t("Entwicklung · Ansatzkriterien und Buchungen")}</summary>
            <p>
              {t(
                " Fiktives Softwareprojekt: seit 01.01.2026 monatlich 18.000 € eindeutig zuordenbare Entwicklungskosten, bereits im HGB-Personalaufwand enthalten. Technische Realisierbarkeit, Fertigstellungsabsicht, Nutzungsfähigkeit, wahrscheinlicher künftiger Nutzen, verfügbare Ressourcen und verlässliche Kostenmessung werden als nachgewiesen unterstellt. Keine Forschungskosten oder nachträgliche Aktivierung früherer Aufwendungen. Betriebsbereitschaft erst 01.01.2027; daher 2026 noch keine Abschreibung. ",
              )}
            </p>
            <p>
              {t(
                " HGB: Das Aktivierungswahlrecht nach § 248 Abs. 2 wird im Beispiel nicht ausgeübt. IFRS: Aktivierung ab erfüllten Kriterien nach IAS 38; der Unterschied entsteht aus dieser konkreten Annahme. ",
              )}
            </p>
            <JournalTable entries={result.periodEntries.filter((e) => e.group === "development")} />
          </details>
          <details className="metric-details">
            <summary>{t("Latente Steuern · Steuerbasis und Buchungen")}</summary>
            <p>
              {t(
                " Fiktiver Steuersatz 30 %. Steuerlicher Buchwert des zusätzlichen Nutzungsrechts und Entwicklungsvermögenswerts: jeweils null. Leasingraten und Entwicklungskosten gelten steuerlich unmittelbar als abzugsfähig; steuerliche Basis der Leasingverbindlichkeit: null. Verrechenbare künftige steuerliche Ergebnisse werden als ausreichend unterstellt. Aktive latente Steuern auf die Leasingverbindlichkeit, passive auf Nutzungsrecht und Entwicklung; Bruttoausweis ohne Saldierungsannahme. Laufende Steuern werden nicht verändert. ",
              )}
            </p>
            <p>
              {t(
                " Der Leasing-Erstansatz erzeugt gleich hohe aktive und passive latente Steuern ohne Netto-Ergebniswirkung. Im Folgezeitraum wird nur die Veränderung der Steuerposten ergebniswirksam gebucht. ",
              )}
            </p>
            <JournalTable
              entries={result.journal.filter(
                (e) =>
                  e.group === "tax" &&
                  (ytd || e.month === Number(period.slice(5)) || e.month === 0),
              )}
            />
          </details>
        </div>
      </Panel>
      <div className="methodology-note">
        <strong>{t("Ein abgegrenztes Beispiel")}</strong>
        <p>
          {t(
            " HGB-Eigenkapital zum Jahresanfang bleibt unverändert; Vertragsbeginn und Projektstart liegen am 01.01.2026. Alle Eigenkapitalanpassungen entstehen im laufenden Jahr. Nicht modelliert sind weitere IFRS-Unterschiede, OCI, Wertminderungen, Fristigkeiten der zusätzlichen Posten und vollständige IFRS-Anhangangaben. Der gesamte Zahlungsmittelbestand bleibt gleich; eine IFRS-Cashflow-Umgliederung wird hier nicht dargestellt. ",
          )}
        </p>
        <p>
          <Link href="/bilanz">{t("HGB-Ausgangsbilanz ↗")}</Link> ·{t(" ")}
          <Link href="/guv">{t("HGB-Ausgangs-GuV ↗")}</Link>
        </p>
        <div className="ifrs-sources">
          <span className="label">{t("Fachliche Referenzen · Demo-Annahmen siehe oben")}</span>
          {ifrsSources.map((s) => (
            <a key={s.href} href={s.href} target="_blank" rel="noreferrer">
              {t(s.label)} ↗
            </a>
          ))}
        </div>
      </div>
    </ModulePage>
  );
}
function BridgeTable({
  rows,
  scale,
  basis,
}: {
  rows: BridgeRow[];
  scale: "eur" | "thousand";
  basis: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label={t("HGB-IFRS-Überleitung, horizontal scrollbar")}
    >
      <table className="data-table statement-table ifrs-table">
        <caption className="sr-only">
          {t(" Vereinfachte Demo-Überleitung · ")}
          {t(basis)} · {t(scale === "eur" ? "Euro" : "Tausend Euro")}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t("Position")}</th>
            {["HGB", "Δ Leasing", "Δ Entwicklung", "Δ latente Steuern", "IFRS-Demo"].map((c) => (
              <th className="number-cell" scope="col" key={c}>
                {t(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={`statement-row-${r.kind}`}>
              <th scope="row">
                <span className="statement-line-label">
                  <span>{t(r.label)}</span>
                  <MetricInfo
                    insight={{
                      title: r.label,
                      definition:
                        "Ausgangswert und Anpassungen aus dem gemeinsamen Demo-Überleitungsjournal.",
                      analysis: `HGB ${formatValue(r.hgb, "currency")}; Leasing ${formatDelta(r.lease, "currency")}; Entwicklung ${formatDelta(r.development, "currency")}; Steuern ${formatDelta(r.tax, "currency")}; IFRS-Demo ${formatValue(r.ifrs, "currency")}.`,
                      sourceLabel: `${basis} · Beispieldaten`,
                      caveat:
                        "Positive Anpassungen erhöhen diese Position; daraus folgt keine automatische wirtschaftliche Verbesserung.",
                    }}
                  />
                </span>
              </th>
              {[r.hgb, r.lease, r.development, r.tax, r.ifrs].map((v, i) => (
                <td
                  className={`number-cell ${i > 0 && i < 4 ? "ifrs-adjustment-cell" : ""}`}
                  key={i}
                >
                  {t(i > 0 && i < 4 && v > 0 ? "+" : "")}
                  {t(formatStatementAmount(v, scale))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function JournalTable({ entries }: { entries: JournalEntry[] }) {
  const { t } = useTranslation();

  if (!entries.length)
    return <p>{t("Dieser Beispielfall ist nicht aktiviert; keine Anpassungsbuchungen.")}</p>;
  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label={t("Anpassungsbuchungen, horizontal scrollbar")}
    >
      <table className="data-table ifrs-journal">
        <caption>
          {t(
            " Anpassungsjournal · EUR · Beträge auf Cent gerundet. Erstansatz separat, Folgebuchungen im gewählten Zeitraum. ",
          )}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t("Buchung")}</th>
            <th scope="col">{t("Soll")}</th>
            <th scope="col">{t("Haben")}</th>
            <th scope="col" className="number-cell">
              {t(" Betrag EUR ")}
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <th scope="row">
                <small>
                  {t(
                    e.month === 0
                      ? "Erstansatz 01.01.2026"
                      : `2026-${String(e.month).padStart(2, "0")}`,
                  )}
                </small>
                {t(e.label)}
              </th>
              <td>{t(accounts[e.debit])}</td>
              <td>{t(accounts[e.credit])}</td>
              <td className="number-cell">
                {t(
                  new Intl.NumberFormat(getLocale(), {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(e.amount),
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
