"use client";
import { useTranslation } from "@/components/i18n/Language";
import { useState } from "react";
import { getKpis } from "@/lib/demo-company";
import { buildReport } from "@/lib/report";
import { downloadText } from "@/lib/export";
import { formatValue, statusLabels } from "@/lib/format";
import { useDemo } from "@/components/shared/DemoProvider";
import { ModulePage, Panel } from "@/components/shared/ModulePage";

export function BoardReport() {
  const { t } = useTranslation();

  const { snapshot, period, rules } = useDemo();
  const [full, setFull] = useState(true),
    [includeCash, setIncludeCash] = useState(true),
    [includeRisks, setIncludeRisks] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const currentNotes = notes[period] ?? "";
  const report = buildReport(snapshot, {
    full,
    includeCash,
    includeRisks,
    notes: currentNotes,
    rules,
  });
  return (
    <ModulePage
      eyebrow={t("Board Report")}
      title={
        <>
          {t(" Klar berichten. ")}
          <em>{t("Entscheidungen ermöglichen.")}</em>
        </>
      }
      description={t(
        "Aus konsistenten Kennzahlen einen nachvollziehbaren Bericht für das Management zusammenstellen.",
      )}
      action={
        <button
          className="button"
          onClick={() =>
            downloadText(
              `CFO-Board-Demo-${period}.md`,
              report.markdown,
              "text/markdown;charset=utf-8",
            )
          }
        >
          {t(" Markdown exportieren ↗ ")}
        </button>
      }
    >
      <div className="report-workspace">
        <aside className="report-editor">
          <Panel index="Bericht konfigurieren" title={t("Inhalt & Format")}>
            <div className="report-controls">
              <div className="filter-pills" role="group" aria-label={t("Berichtsformat")}>
                <button aria-pressed={!full} onClick={() => setFull(false)}>
                  {t(" Executive Flash ")}
                </button>
                <button aria-pressed={full} onClick={() => setFull(true)}>
                  {t(" Board Pack ")}
                </button>
              </div>
              <label className="checkbox-control">
                <input
                  type="checkbox"
                  checked={includeRisks}
                  onChange={(e) => setIncludeRisks(e.target.checked)}
                />
                {t(" Risiken & Datenlücken ")}
              </label>
              <label className="checkbox-control">
                <input
                  type="checkbox"
                  checked={includeCash}
                  onChange={(e) => setIncludeCash(e.target.checked)}
                />
                {t(" Liquiditätsvorschau ")}
              </label>
              <label className="notes-label" htmlFor="management-notes">
                {t(" Management-Ergänzungen ")}
                <textarea
                  id="management-notes"
                  rows={7}
                  maxLength={4000}
                  placeholder={t("Eigene Einschätzungen und Beschlussvorschläge ergänzen …")}
                  value={currentNotes}
                  onChange={(e) => setNotes({ ...notes, [period]: e.target.value })}
                />
              </label>
              <p className="small-muted">
                {t(
                  " Ergänzungen bleiben nur in dieser Ansicht und werden mit exportiert. Keine automatische Speicherung. ",
                )}
              </p>
              <button className="button primary-button" onClick={() => window.print()}>
                {t(" Bericht drucken / als PDF sichern ↗ ")}
              </button>
              <p className="small-muted">
                {t(" Öffnet den Druckdialog des Browsers. Für PDF dort „Als PDF sichern“ wählen. ")}
              </p>
            </div>
          </Panel>
          <div className="report-source-note">
            <span className="label">{t("Nachvollziehbar statt Blackbox")}</span>
            <p>
              {t(
                " Die Vorschau ist eine deterministische Berichtsvorlage. Kennzahlen und Texte stammen aus demselben Demoabschluss; es läuft kein KI-Agent. ",
              )}
            </p>
          </div>
        </aside>
        <article className="report-sheet" aria-label={t("Berichtsvorschau")}>
          <header className="report-sheet-header">
            <div>
              <span className="report-brand">{t("STRICKER INTERIM")}</span>
              <span className="report-type">
                {t("CFO ")}
                {t(full ? "Board Pack" : "Executive Flash")}
              </span>
            </div>
            <span className="demo-badge">{t("Demo")}</span>
          </header>
          <div className="report-sheet-body">
            <p className="eyebrow">
              {t("Mittelstand GmbH · ")}
              {t(snapshot.label)}
            </p>
            <h2 className="report-headline">{t(snapshot.headline)}</h2>
            <p className="report-lead">{t(snapshot.summary)}</p>
            <div className="report-kpis">
              {snapshot.result.metrics.map((m) => (
                <div key={m.id}>
                  <span className="label">{t(m.label)}</span>
                  <strong>{t(formatValue(m.value, m.unit))}</strong>
                  <span className="status" data-status={m.status}>
                    <span className="status-dot" />
                    {t(statusLabels[m.status])}
                  </span>
                </div>
              ))}
            </div>
            {full && (
              <section className="report-section">
                <h3>{t("CFO-Kommentar")}</h3>
                {report.paragraphs.map((p, i) => (
                  <p key={i}>{t(p)}</p>
                ))}
              </section>
            )}
            {full && (
              <section className="report-section">
                <h3>{t("Bilanz, GuV und historischer Cashflow")}</h3>
                <dl className="report-statement-summary">
                  {report.statementSummary.map((row) => (
                    <div key={row.label}>
                      <dt>{t(row.label)}</dt>
                      <dd>{t(formatValue(row.value, "currency"))}</dd>
                    </div>
                  ))}
                </dl>
                <p>
                  {t(
                    " Historische Monatswerte und Stichtagsbestände der Demo; getrennt von der folgenden Liquiditätsvorschau. ",
                  )}
                </p>
              </section>
            )}
            {full && (
              <section className="report-section">
                <h3>{t("Ergebnisrechnung")}</h3>
                <div className="table-scroll">
                  <table className="data-table report-data-table">
                    <caption className="sr-only">
                      {t("Ergebnisrechnung aus dem Demoabschluss")}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">{t("Position")}</th>
                        <th scope="col" className="number-cell">
                          {t(" Ist EUR ")}
                        </th>
                        <th scope="col" className="number-cell">
                          {t(" Plan EUR ")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.rows.map((r) => (
                        <tr key={r.label}>
                          <th scope="row">{t(r.label)}</th>
                          <td className="number-cell">{t(formatValue(r.actual, "currency"))}</td>
                          <td className="number-cell">{t(formatValue(r.budget, "currency"))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {includeRisks && (
              <section className="report-section">
                <h3>{t("Risiken & Datenlücken")}</h3>
                <ul>
                  {report.risks.map((r) => (
                    <li key={r}>{t(r)}</li>
                  ))}
                </ul>
              </section>
            )}
            {includeCash && (
              <section className="report-section">
                <h3>{t("Liquiditätsvorschau")}</h3>
                <p>{t("Eigenständige fiktive Zahlungsannahmen; keine Ableitung aus der GuV.")}</p>
                <div className="report-cash">
                  {report.forecast.map((m) => (
                    <div key={m.month}>
                      <span>{t(m.month)} 2026</span>
                      <strong>{t(formatValue(m.closing, "currency"))}</strong>
                      <span>{t("Endbestand")}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section className="report-section">
              <h3>{t("Empfohlene Maßnahmen")}</h3>
              <ol>
                {snapshot.actions.map((a) => (
                  <li key={a.id}>
                    <strong>{t(a.title)}.</strong> {t(a.owner)} {t(" · Demo-Zieldatum ")}
                    {t(a.due)}.
                  </li>
                ))}
              </ol>
            </section>
            {currentNotes.trim() && (
              <section className="report-section">
                <h3>{t("Management-Ergänzungen")}</h3>
                <p className="report-user-notes">{currentNotes}</p>
              </section>
            )}
            <footer className="report-footnotes">
              <strong>{t("Datenbasis & Annahmen")}</strong>
              <p>
                {t(
                  getKpis(period, rules)
                    .filter((d) => d.rule)
                    .map(
                      (d) =>
                        `${d.metric.label}: ${d.rule!.direction === "higher" ? "≥" : "≤"} ${formatValue(d.rule!.good, d.metric.unit)}`,
                    )
                    .join(" · "),
                )}
              </p>
              <p>
                {t(" Fiktiver Demo-Monatsabschluss · ")}
                {t(snapshot.result.period.start)} {t(" bis ")}
                {t(snapshot.end)}{" "}
                {t(
                  " · EUR. Zielwerte gemäß „Annahmen & Ziele“ dieser Sitzung. Working Capital mit Stichtags-Proxys. Keine unabhängige Prüfung, keine ausgeführte KI-Analyse, keine bestätigte Maßnahmenumsetzung. ",
                )}
              </p>
            </footer>
          </div>
        </article>
      </div>
    </ModulePage>
  );
}
