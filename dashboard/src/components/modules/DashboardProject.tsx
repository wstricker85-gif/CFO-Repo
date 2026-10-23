"use client";
import { SwissFlag } from "@/components/shared/SwissFlag";
import { useTranslation } from "@/components/i18n/Language";
import Link from "next/link";
import { ModulePage } from "@/components/shared/ModulePage";
export function DashboardProject() {
  const { t } = useTranslation();

  return (
    <ModulePage
      eyebrow={t("Individuelles Dashboard")}
      title={
        <>
          {t(" Dein CFO-Dashboard. ")}
          <em>{t("Mit verantwortungsvoller AI.")}</em>
        </>
      }
      description={t(
        "Von der interaktiven Demo zur individuellen Lösung – in Kooperation mit Swissi Holding AG.",
      )}
      showPeriod={false}
      showContext={false}
      footerNote={t("Individuelle Projektlösung · In Kooperation mit Swissi Holding AG")}
    >
      <section className="project-partnership" aria-labelledby="project-partnership-title">
        <div className="project-partners">
          <span>{t("STRICKER INTERIM")}</span>
          <span aria-hidden="true">×</span>
          <a href="https://swissi-ai.institute/de" target="_blank" rel="noreferrer">
            {t(" Swissi ")}
            <SwissFlag />
            <span aria-hidden="true">↗</span>
          </a>
        </div>
        <span className="label">{t("In Kooperation mit Swissi Holding AG")}</span>
        <h2 id="project-partnership-title">
          {t("Ein vollständiges Dashboard für dein Unternehmen.")}
        </h2>
        <p>
          {t(
            " Finanzsteuerung, Datenanbindung und AI-gestützte Analysen werden im Rahmen eines gemeinsamen Projekts auf deine Prozesse und Systemlandschaft zugeschnitten. ",
          )}
        </p>
        <div className="project-primary-actions">
          <a className="button primary-button" href="https://stricker-interim.de/#kontakt">
            {t(" Projekt gemeinsam besprechen ↗ ")}
          </a>
          <a
            className="text-link"
            href="https://swissi-ai.institute/de"
            target="_blank"
            rel="noreferrer"
          >
            {t(" Swissi Institute for AI kennenlernen ↗ ")}
          </a>
        </div>
      </section>
      <section className="project-governance" aria-labelledby="project-governance-title">
        <span className="label">{t("Datenschutz & Compliance by Design")}</span>
        <h2 id="project-governance-title">
          {t("Datenschutzkonforme und compliance-konforme AI.")}
        </h2>
        <p>
          {t(
            " Datenschutz, regulatorische Anforderungen und interne Richtlinien werden von Anfang an in die Projektarchitektur eingebaut. Die Anforderungen werden für deinen konkreten Einsatz festgelegt, umgesetzt und vor dem produktiven Betrieb geprüft und freigegeben. ",
          )}
        </p>
        <div className="project-controls">
          <article>
            <h3>{t("Kontrolle über deine Daten")}</h3>
            <p>
              {t(
                " Zweckbindung, Datenminimierung, Rollen und Berechtigungen sowie abgestimmte Speicher- und Löschregeln begrenzen, welche Daten verarbeitet werden dürfen. ",
              )}
            </p>
          </article>
          <article>
            <h3>{t("Passendes Betriebsmodell")}</h3>
            <p>
              {t(
                " Hosting, AI-Anbieter, Verarbeitungsorte und erforderliche Verträge werden anhand deiner Datenschutz- und Compliance-Vorgaben ausgewählt und dokumentiert. ",
              )}
            </p>
          </article>
          <article>
            <h3>{t("Nachvollziehbare Ergebnisse")}</h3>
            <p>
              {t(
                " Quellen, Rechenwege, Datenstände und AI-Ausgaben werden nachvollziehbar aufbereitet. Protokollierung und fachliche Freigaben unterstützen die Kontrolle. ",
              )}
            </p>
          </article>
          <article>
            <h3>{t("Klare Grenzen für AI")}</h3>
            <p>
              {t(
                " Finanzkennzahlen werden durch definierte Berechnungen ermittelt. AI unterstützt die Interpretation innerhalb festgelegter Zugriffe; verantwortliche Personen behalten die fachliche Aufsicht. ",
              )}
            </p>
          </article>
        </div>
      </section>
      <section className="project-capabilities" aria-labelledby="project-capabilities-title">
        <div className="project-section-heading">
          <span className="label">{t("Möglicher Projektumfang")}</span>
          <h2 id="project-capabilities-title">{t("Von deinen Daten zur Entscheidung.")}</h2>
        </div>
        <div className="project-capability-grid">
          <article>
            <span className="label">{t("01 / Verbinden")}</span>
            <h3>{t("Datenquellen integrieren")}</h3>
            <p>
              {t(
                " Buchhaltung, ERP und DATEV-Exporte mit Kontenzuordnung, Qualitätsprüfungen und automatisierten Aktualisierungen. ",
              )}
            </p>
          </article>
          <article>
            <span className="label">{t("02 / Steuern")}</span>
            <h3>{t("Ein gemeinsames Finanzbild")}</h3>
            <p>
              {t(
                " GuV, Bilanz, Cashflow, Kennzahlen, Planung und Managementberichte auf einer konsistenten Datenbasis. ",
              )}
            </p>
          </article>
          <article>
            <span className="label">{t("03 / Verstehen")}</span>
            <h3>{t("AI sinnvoll einsetzen")}</h3>
            <p>
              {t(
                " Erklärungen, Auffälligkeiten und Berichtsentwürfe auf geprüften Zahlen – mit nachvollziehbaren Quellen und fachlichen Kontrollen. ",
              )}
            </p>
          </article>
        </div>
      </section>
      <div className="project-next-step">
        <div>
          <h2>{t("Gemeinsam den passenden Umfang festlegen.")}</h2>
          <p>
            {t(
              " Im Erstgespräch klären wir Datenquellen, Ziele, Nutzerrollen und die Anforderungen an Datenschutz, Compliance und AI. ",
            )}
          </p>
        </div>
        <a className="button primary-button" href="https://stricker-interim.de/#kontakt">
          {t(" Gespräch vereinbaren ↗ ")}
        </a>
      </div>
      <p className="project-demo-scope">
        {t(
          " Diese Demo zeigt ausgewählte Funktionen mit fiktiven Unternehmensdaten und regelbasierten Erläuterungen. Die produktive Datenanbindung und AI-Integration werden im individuellen Projekt umgesetzt. ",
        )}
        <Link href="/daten">{t("CSV-Demo ausprobieren ↗")}</Link>
      </p>
    </ModulePage>
  );
}
