"use client";
import { Select } from "@/components/ui/Select";
import { useTranslation } from "@/components/i18n/Language";
import Link from "next/link";
import { useState } from "react";
import { validatePnlCsv, csvColumns, getCsvTemplate } from "@/lib/csv";
import { downloadText } from "@/lib/export";
import { ModulePage } from "@/components/shared/ModulePage";
import { CsvAnalysis } from "@/components/shared/CsvAnalysis";

export function DataWorkspace() {
  const { t, language } = useTranslation();
  const template = getCsvTemplate(language);

  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [delimiter, setDelimiter] = useState(";"),
    [locale, setLocale] = useState<"de" | "en">("de");
  const [readError, setReadError] = useState(""),
    [loading, setLoading] = useState(false),
    [dragging, setDragging] = useState(false);
  const result = content ? validatePnlCsv(content, delimiter, locale) : null;
  async function readFile(file: File | undefined) {
    if (!file || loading) return;
    setReadError("");
    setContent("");
    setFilename(file.name);
    if (file.size > 2 * 1024 * 1024) {
      setReadError("Die Datei ist zu groß. Die lokale Vorschau unterstützt bis zu 2 MB.");
      return;
    }
    if (!/\.(csv|tsv)$/i.test(file.name)) {
      setReadError(
        "Bitte eine CSV- oder TSV-Datei verwenden. Excel-Dateien zuerst als CSV speichern.",
      );
      return;
    }
    setLoading(true);
    try {
      setContent(await file.text());
      if (/\.tsv$/i.test(file.name)) setDelimiter("\t");
    } catch {
      setReadError("Die Datei konnte nicht gelesen werden. Bitte erneut auswählen.");
    } finally {
      setLoading(false);
    }
  }
  function loadExample() {
    setContent(template);
    setFilename("Demo-Beispiel.csv");
    setDelimiter(";");
    setLocale("de");
    setReadError("");
  }
  return (
    <ModulePage
      eyebrow={t("CSV-Demo & Auswertung")}
      title={
        <>
          {t(" CSV testen. ")}
          <em>{t("Zahlen verstehen.")}</em>
        </>
      }
      description={t(
        "Test-CSV herunterladen, hier ablegen und die Auswertung direkt darunter entdecken.",
      )}
      showPeriod={false}
      showContext={false}
    >
      <section className="csv-quickstart" aria-label={t("In drei Schritten zur Auswertung")}>
        <ol>
          <li>
            <span className="label">{t("01 / Testdatei")}</span>
            <button
              className="button primary-button"
              onClick={() =>
                downloadText(
                  "CFO-Monatsabschluss-Vorlage.csv",
                  "\uFEFF" + template,
                  "text/csv;charset=utf-8",
                )
              }
            >
              {t(" Test-CSV herunterladen ↓ ")}
            </button>
            <button className="text-button" disabled={loading} onClick={loadExample}>
              {t(" Oder Beispiel direkt laden ↗ ")}
            </button>
          </li>
          <li>
            <span className="label">{t("02 / Datei ablegen")}</span>
            <p>
              {t("Die Testdatei unten ablegen oder eine eigene CSV im gleichen Format auswählen.")}
            </p>
          </li>
          <li>
            <span className="label">{t("03 / Auswertung ansehen")}</span>
            <p>{t("Kennzahlen, Planvergleiche und Diagramme erscheinen direkt darunter.")}</p>
          </li>
        </ol>
      </section>
      <p className="csv-demo-note">
        {t(
          " Vereinfachte Funktionsdemo · Verarbeitung nur in deinem Browser · Keine KI-Ausführung · Dashboard-Beispieldaten bleiben unverändert. ",
        )}
      </p>
      <section className="csv-upload-compact" aria-label={t("CSV auswählen")}>
        <div
          className={`file-dropzone csv-dropzone-compact ${dragging ? "is-dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void readFile(e.dataTransfer.files[0]);
          }}
        >
          <span className="file-icon" aria-hidden="true">
            ↥
          </span>
          <div>
            <h2>{t("CSV hier ablegen")}</h2>
            <p id="csv-file-help">{t("CSV oder TSV · bis 2 MB · ein Kalenderjahr")}</p>
          </div>
          <label className="file-input-label">
            <span className="sr-only">{t("Datei auswählen")}</span>
            <input
              type="file"
              accept=".csv,.tsv"
              disabled={loading}
              aria-describedby="csv-file-help"
              onChange={(e) => void readFile(e.target.files?.[0])}
            />
          </label>
        </div>
        {loading && (
          <p className="import-status" role="status">
            {t(" Datei wird lokal gelesen … ")}
          </p>
        )}
        {readError && (
          <p className="form-error import-status" role="alert">
            {t(readError)}
          </p>
        )}
        {!loading &&
          !readError &&
          result &&
          result.errors.length === 0 &&
          result.rows.length > 0 && (
            <div className="csv-processing-success" role="status" aria-atomic="true">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>{t("CSV erfolgreich verarbeitet.")}</strong>
                <p>
                  {result.rows.length}{" "}
                  {t(result.rows.length === 1 ? "Monat wurde" : "Monate wurden")}
                  {t(" ")}
                  {t(" geprüft. Deine Auswertung ist bereit. ")}
                </p>
              </div>
              <a className="text-link" href="#csv-preview">
                {t(" Zur Auswertung ↓ ")}
              </a>
            </div>
          )}
        {filename && !loading && (
          <div className="csv-file-status">
            <span>{filename}</span>
            <div>
              <button
                className="text-button"
                onClick={() => {
                  setContent("");
                  setFilename("");
                  setReadError("");
                }}
              >
                {t(" Entfernen × ")}
              </button>
            </div>
          </div>
        )}
      </section>
      <details className="csv-compact-help">
        <summary>{t("Eigene CSV verwenden? Format & Einstellungen")}</summary>
        <div className="import-options">
          <label>
            {t(" Trennzeichen ")}
            <Select value={delimiter} onChange={(e) => setDelimiter(e.target.value)}>
              <option value=";">{t("Semikolon ;")}</option>
              <option value=",">{t("Komma ,")}</option>
              <option value={"\t"}>{t("Tabulator")}</option>
            </Select>
          </label>
          <label>
            {t(" Zahlenformat ")}
            <Select value={locale} onChange={(e) => setLocale(e.target.value as "de" | "en")}>
              <option value="de">{t("Deutsch · 1.234,56")}</option>
              <option value="en">{t("Englisch · 1,234.56")}</option>
            </Select>
          </label>
        </div>
        <p>
          {t(
            " Eine Zeile pro Monat, Beträge in EUR. Fünf Pflichtspalten genügen für Umsatz und EBITDA. Optionale Angaben ergänzen die übrigen Kennzahlen; leer bedeutet „Nicht verfügbar“. ",
          )}
        </p>
        <dl className="csv-compact-fields">
          {csvColumns.map((column) => (
            <div key={column.key}>
              <dt>
                {language === "en" ? column.aliases[1] : column.label}
                <small>{t(column.required ? "Pflicht" : "Optional")}</small>
              </dt>
              <dd>{t(column.description)}</dd>
            </div>
          ))}
        </dl>
        <p>
          {t(
            " Umsatz und operative Kosten positiv. Zinsen, Ertragsteuern, Plan-EBITDA und Eigenkapital dürfen negativ sein. Ergebnis- und Planwerte sind Monatswerte; Bestände gelten zum Monatsende. Ein Kalenderjahr, keine doppelten Monate, keine Formeln oder €-Zeichen. ",
          )}
        </p>
      </details>
      <section
        id="csv-preview"
        className="data-preview csv-preview-compact"
        tabIndex={-1}
        aria-labelledby="csv-preview-title"
      >
        <div className="data-preview-heading">
          <h2 id="csv-preview-title">{t("Deine Auswertung")}</h2>
        </div>
        {result && result.errors.length > 0 && (
          <div className="validation-errors" role="alert">
            <h3>{t("Bitte die Datei prüfen")}</h3>
            <ul>
              {result.errors.slice(0, 20).map((error, i) => (
                <li key={i}>{t(error)}</li>
              ))}
            </ul>
            {result.errors.length > 20 && (
              <p>
                {t("Weitere ")}
                {result.errors.length - 20} {t(" Fehler.")}
              </p>
            )}
            <p>
              {t(
                "Format und Zahlenformat lassen sich oben unter „Format & Einstellungen“ anpassen.",
              )}
            </p>
          </div>
        )}
        {!!result?.rows.length && <CsvAnalysis key={content} rows={result.rows} />}
        {!result && !readError && (
          <p className="csv-empty-compact">
            {t(
              " Noch keine Datei ausgewählt. Lade oben die Test-CSV herunter oder starte mit „Beispiel direkt laden“. ",
            )}
          </p>
        )}
      </section>
      <p className="csv-project-link">
        {t(" Für deine produktive Lösung:")}
        {t(" ")}
        <Link href="/projekt">{t("Individuelles CFO-Dashboard in Kooperation mit Swissi ↗")}</Link>
      </p>
    </ModulePage>
  );
}
