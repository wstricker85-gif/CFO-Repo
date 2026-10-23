"use client";
import { useTranslation } from "@/components/i18n/Language";
import Link from "next/link";
import { getKpis } from "@/lib/demo-company";
import { formatValue } from "@/lib/format";
import { useDemo } from "./DemoProvider";
import { ModulePage, Panel } from "./ModulePage";
export function Assumptions() {
  const { t } = useTranslation();

  const { period, rules, setRules } = useDemo();
  return (
    <ModulePage
      eyebrow={t("Annahmen & Ziele")}
      title={
        <>
          {t(" Die Basis. ")}
          <em>{t("Offen gelegt.")}</em>
        </>
      }
      description={t("Zielwerte, Datenbasis und Szenarien nachvollziehbar an einem Ort.")}
    >
      <Panel
        index="01 / Gemeinsame Ziele"
        title={t("Ein Maßstab für die Demo")}
        action={
          <Link className="button" href="/kpi#zielwerte">
            {t(" Zielwerte anpassen ↗ ")}
          </Link>
        }
      >
        <p className="panel-note">
          {t(
            " Änderungen gelten für Übersicht, KPI-Monitor, Liquiditätsreserve und Board Report. Sie bleiben während der Navigation erhalten. Neuladen stellt die Demo-Standards wieder her. ",
          )}
        </p>
        <div className="table-scroll">
          <table className="data-table">
            <caption className="sr-only">{t("Aktive Zielkorridore")}</caption>
            <thead>
              <tr>
                <th>{t("Kennzahl")}</th>
                <th>{t("Grün")}</th>
                <th>{t("Gelb")}</th>
              </tr>
            </thead>
            <tbody>
              {getKpis(period, rules)
                .filter((d) => d.rule)
                .map((d) => (
                  <tr key={d.metric.id}>
                    <th scope="row">{t(d.metric.label)}</th>
                    <td>
                      {t(d.rule!.direction === "higher" ? "≥" : "≤")}
                      {t(" ")}
                      {t(formatValue(d.rule!.good, d.metric.unit))}
                    </td>
                    <td>
                      {t(d.rule!.direction === "higher" ? "≥" : "≤")}
                      {t(" ")}
                      {t(formatValue(d.rule!.watch, d.metric.unit))}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="form-actions">
          <button className="button" onClick={() => setRules({})}>
            {t(" Alle Ziele zurücksetzen ")}
          </button>
        </div>
      </Panel>
      <Panel index="02 / Methodik" title={t("Historie und Szenarien")}>
        <div className="assumption-notes">
          <div>
            <h3>{t("Historischer Abschluss")}</h3>
            <p>
              {t(
                " Fiktive Monatsabschlüsse 2026. GuV, Bilanz und Cashflow teilen dieselben Buchungsdaten. Historische Steuern und Bestände bleiben fest; Zielwerte ändern nur die Bewertung. ",
              )}
            </p>
          </div>
          <div>
            <h3>{t("Working Capital")}</h3>
            <p>
              {t(
                " Stichtagsbestände als Näherung. Materialaufwand dient als Einkäufe-Proxy. Das DSO-Szenario zeigt einen einmaligen Bestandsabbau; es fließt nicht automatisch in den Zahlungsplan ein. ",
              )}
            </p>
            <Link href="/working-capital">{t("Kapitalbindung untersuchen ↗")}</Link>
          </div>
          <div>
            <h3>{t("Prognose & Bewertung")}</h3>
            <p>
              {t(
                " Budget-Szenarien, Zahlungsplan und DCF sind eigenständige Modellansichten. Ihre Annahmen stehen direkt am jeweiligen Modell und verändern den historischen Abschluss nicht. ",
              )}
            </p>
            <Link href="/budget">{t("Forecast testen ↗")}</Link> ·{t(" ")}
            <Link href="/bewertung">{t("DCF-Annahmen ansehen ↗")}</Link>
          </div>
          <div>
            <h3>{t("Vergleichsbasis")}</h3>
            <p>
              {t(
                " Ist gegen Plan in der Ergebnisrechnung; Vormonat auf den Kernkennzahlen; Zielkorridore für Ampeln. Margendifferenzen werden in Prozentpunkten (PP) ausgewiesen. Fehlende Daten bleiben als Datenlücke sichtbar. ",
              )}
            </p>
          </div>
        </div>
      </Panel>
      <p className="inline-note">
        {t(" Die ")}
        <Link href="/ifrs">{t("HGB → IFRS-Demo ↗")}</Link>{" "}
        {t(
          " ergänzt den Ausgangsabschluss um ein separates Überleitungsjournal. Ihre festen Beispielannahmen stehen direkt im Modul; die Zielwerte oben verändern keine IFRS-Buchungen. ",
        )}
      </p>
    </ModulePage>
  );
}
