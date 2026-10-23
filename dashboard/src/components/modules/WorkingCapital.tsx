"use client";
import { getLocale } from "@/lib/i18n";
import { useTranslation } from "@/components/i18n/Language";
import { useState, useSyncExternalStore } from "react";
import { getCapital, getInvoices, getCashPlan } from "@/lib/demo-company";
import { cashForecast, round } from "@/lib/finance";
import { downloadCsv } from "@/lib/export";
import { formatCompactCurrency, formatDelta, formatValue } from "@/lib/format";
import { useDemo } from "@/components/shared/DemoProvider";
import { EmptyState, ModulePage, Panel } from "@/components/shared/ModulePage";
import { SummaryStat } from "@/components/shared/Visuals";

const bucketLabels = {
  current: "Nicht überfällig",
  "1-30": "1–30 Tage",
  "31-60": "31–60 Tage",
  "61+": "Über 60 Tage",
};
const subscribeHash = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};
export function WorkingCapital() {
  const { t } = useTranslation();

  const { period, snapshot, rules } = useDemo();
  const c = getCapital(period);
  const reserve = rules.cash?.good ?? 500000;
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => "",
  );
  const invoices = getInvoices(period);
  const [selectedBucket, setBucket] = useState<string | null>(null),
    [search, setSearch] = useState("");
  const [sort, setSort] = useState("due"),
    [reduction, setReduction] = useState(5);
  const bucket = selectedBucket ?? (hash === "#ueberfaellig" ? "overdue30" : "all");
  const displayed = invoices
    .filter(
      (i) =>
        (bucket === "all" || (bucket === "overdue30" ? i.days > 30 : i.bucket === bucket)) &&
        `${i.customer} ${i.id}`.toLocaleLowerCase("de").includes(search.toLocaleLowerCase("de")),
    )
    .sort((a, b) => (sort === "amount" ? b.amount - a.amount : a.dueDate.localeCompare(b.dueDate)));
  const cash = cashForecast(c.cash, getCashPlan(period));
  const release = round((snapshot.rows[0].actual / c.days) * reduction);
  function exportInvoices() {
    downloadCsv(`Offene-Posten-Demo-${period}.csv`, [
      ["DEMODATEN", snapshot.label],
      ["Rechnung", "Kunde", "Offener Betrag EUR", "Fällig", "Tage überfällig", "Altersklasse"],
      ...displayed.map((i) => [
        i.id,
        i.customer,
        i.amount,
        i.dueDate,
        i.days,
        bucketLabels[i.bucket],
      ]),
    ]);
  }
  return (
    <ModulePage
      eyebrow={t("Working Capital")}
      title={
        <>
          {t(" Liquidität freisetzen. ")}
          <em>{t("Spielraum gewinnen.")}</em>
        </>
      }
      description={t(
        "Kapitalbindung, Forderungsalter und den kurzfristigen Liquiditätsverlauf zusammen betrachten.",
      )}
      action={
        <button className="button" onClick={exportInvoices}>
          {t(" Offene Posten exportieren ↗ ")}
        </button>
      }
    >
      <div className="summary-grid">
        <SummaryStat
          label={"Net Working Capital"}
          value={formatCompactCurrency(c.nwc)}
          detail={t("Forderungen + Vorräte − Lieferverbindlichkeiten")}
        />
        <SummaryStat
          label={"Cash Conversion Cycle"}
          value={formatValue(c.ccc, "days")}
          detail={t(`${c.dso} Tage DSO + ${c.dio} Tage DIO − ${c.dpo} Tage DPO`)}
        />
        <SummaryStat
          label={"Forderungen > 30 Tage"}
          value={formatCompactCurrency(c.overdue30)}
          detail={t(
            `${formatValue((c.overdue30 / c.receivables) * 100, "percent")} des offenen Bestands`,
          )}
        />
        <SummaryStat
          label={"Liquiditätsreserve"}
          value={formatCompactCurrency(c.cash - reserve)}
          detail={t(`Abstand zum Mindestbestand ${formatCompactCurrency(reserve)}`)}
          tone={c.cash >= reserve ? "good" : "warning"}
        />
      </div>
      <div className="module-two-column">
        <Panel index="01 / Kapitalbindung" title={t("Der Weg vom Auftrag zum Cash")}>
          <div className="cash-cycle">
            {[
              { label: "Forderungen", days: c.dso, value: c.receivables, formula: "DSO" },
              { label: "Vorräte", days: c.dio, value: c.inventory, formula: "+ DIO" },
              { label: "Verbindlichkeiten", days: c.dpo, value: c.payables, formula: "− DPO" },
            ].map((item) => (
              <div key={item.label}>
                <span className="label">{t(item.formula)}</span>
                <strong>
                  {item.days}
                  <small>{t("Tage")}</small>
                </strong>
                <span>{t(item.label)}</span>
                <span className="small-muted">{t(formatCompactCurrency(item.value))}</span>
              </div>
            ))}
          </div>
          <div className="panel-note">
            {t(
              " Stichtagsbestände als Näherung; Materialaufwand als Proxy für Einkäufe. Kalendertage der Periode: ",
            )}
            {c.days}
            {t(". Keine gleitenden Durchschnittsbestände verfügbar. ")}
          </div>
        </Panel>
        <Panel index="02 / Was-wäre-wenn" title={t("Schnellere Zahlungseingänge")}>
          <div className="scenario-content">
            <label className="range-label" htmlFor="dso-reduction">
              {t(" DSO reduzieren um ")}
              <strong>
                {reduction} {t(" Tage")}
              </strong>
            </label>
            <input
              id="dso-reduction"
              type="range"
              min="0"
              max="15"
              step="1"
              value={reduction}
              onChange={(e) => setReduction(Number(e.target.value))}
            />
            <div className="range-endpoints">
              <span>{t("0 Tage")}</span>
              <span>{t("15 Tage")}</span>
            </div>
            <div className="scenario-result">
              <span className="label">{t("Rechnerisches Cash-Potenzial")}</span>
              <strong>{t(formatCompactCurrency(release))}</strong>
              <span>
                {t("DSO im Szenario: ")}
                {c.dso - reduction} {t(" Tage")}
              </span>
            </div>
            <p className="small-muted">
              {t(
                " Monatsumsatz ÷ Kalendertage × eingesparte Tage. Einmaliger Bestandsabbau, kein zusätzlicher Umsatz. Nicht automatisch im Cash-Forecast berücksichtigt. ",
              )}
            </p>
          </div>
        </Panel>
      </div>
      <div id="ueberfaellig" className="detail-anchor" />
      {bucket === "overdue30" && (
        <p className="inline-note" role="status">
          {t(" Analysefilter aktiv: Forderungen mehr als 30 Tage überfällig. ")}
        </p>
      )}
      <Panel
        index="03 / Forderungsmanagement"
        title={t("Offene Posten & Altersstruktur")}
        action={
          <span className="panel-period">
            {invoices.length} {t(" Rechnungen")}
          </span>
        }
      >
        <div className="aging-grid">
          {Object.entries(bucketLabels).map(([id, label]) => {
            const total = invoices
              .filter((i) => i.bucket === id)
              .reduce((sum, i) => sum + i.amount, 0);
            return (
              <button
                key={id}
                className="aging-card"
                aria-pressed={bucket === id}
                onClick={() => setBucket(bucket === id ? "all" : id)}
              >
                <span>{t(label)}</span>
                <strong>{t(formatCompactCurrency(total))}</strong>
                <span className="aging-track">
                  <i
                    style={{
                      width: `${(total / c.receivables) * 100}%`,
                      background:
                        id === "61+"
                          ? "var(--status-warning)"
                          : id === "31-60"
                            ? "var(--status-watch)"
                            : "var(--series-1)",
                    }}
                  />
                </span>
              </button>
            );
          })}
        </div>
        <div className="filter-row panel-filter">
          <label className="search-control">
            <span className="sr-only">{t("Rechnung oder Kunde suchen")}</span>
            <input
              type="search"
              placeholder={t("Kunde oder Rechnungsnummer …")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="select-control">
            {t(" Sortieren ")}
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="due">{t("Fälligkeit")}</option>
              <option value="amount">{t("Betrag absteigend")}</option>
            </select>
          </label>
          {bucket !== "all" && (
            <button className="text-button" onClick={() => setBucket("all")}>
              {t(" Filter aufheben × ")}
            </button>
          )}
          <span className="results-count">
            {displayed.length} {t(" Rechnungen")}
          </span>
        </div>
        {displayed.length ? (
          <div className="table-scroll" tabIndex={0} role="region" aria-label={t("Offene Posten")}>
            <table className="data-table">
              <caption className="sr-only">
                {t("Fiktive offene Forderungen zum ")}
                {t(snapshot.end)}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t("Kunde / Rechnung")}</th>
                  <th scope="col">{t("Fällig am")}</th>
                  <th scope="col">{t("Altersklasse")}</th>
                  <th scope="col" className="number-cell">
                    {t(" Offen EUR ")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((i) => (
                  <tr key={i.id}>
                    <th scope="row">
                      {t(i.customer)}
                      <small>{t(i.id)}</small>
                    </th>
                    <td>
                      {t(
                        new Intl.DateTimeFormat(getLocale(), { timeZone: "UTC" }).format(
                          new Date(i.dueDate),
                        ),
                      )}
                    </td>
                    <td>
                      <span
                        className="status"
                        data-status={i.days > 60 ? "warning" : i.days > 30 ? "watch" : "neutral"}
                      >
                        <span className="status-dot" />
                        {t(bucketLabels[i.bucket])}
                      </span>
                    </td>
                    <td className="number-cell tabular">{t(formatValue(i.amount, "currency"))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={3}>
                    {t(" Summe der angezeigten Posten ")}
                  </th>
                  <td className="number-cell">
                    {t(
                      formatValue(
                        displayed.reduce((sum, i) => sum + i.amount, 0),
                        "currency",
                      ),
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <EmptyState
            title={t("Keine offenen Posten in dieser Auswahl")}
            description={t("Filter aufheben oder einen anderen Kunden suchen.")}
          />
        )}
      </Panel>
      <Panel
        index="04 / Liquiditätsvorschau"
        title={t("Drei Monate voraus")}
        action={<span className="panel-period">{t("Demo-Annahmen · EUR")}</span>}
      >
        <div className="cash-forecast-grid">
          {cash.map((month) => (
            <article key={month.month} className="cash-forecast-card">
              <h3>{t(month.month)} 2026</h3>
              <dl>
                <div>
                  <dt>{t("Anfangsbestand")}</dt>
                  <dd>{t(formatCompactCurrency(month.opening))}</dd>
                </div>
                <div>
                  <dt>{t("Einzahlungen")}</dt>
                  <dd data-assessment="improving">{t(formatCompactCurrency(month.receipts))}</dd>
                </div>
                <div>
                  <dt>{t("Auszahlungen")}</dt>
                  <dd>{t(formatCompactCurrency(month.payments))}</dd>
                </div>
                <div>
                  <dt>{t("Netto-Cashflow")}</dt>
                  <dd data-assessment={month.net >= 0 ? "improving" : "deteriorating"}>
                    {t(formatDelta(month.net, "currency"))}
                  </dd>
                </div>
                <div className="cash-closing">
                  <dt>{t("Endbestand")}</dt>
                  <dd data-status={month.closing >= reserve ? "good" : "warning"}>
                    {t(formatCompactCurrency(month.closing))}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <div className="panel-note">
          {t(
            " Ein- und Auszahlungen sind eigenständige Demo-Planannahmen. Keine automatische Ableitung aus Rechnungsfälligkeiten. Mindestbestand: ",
          )}
          {t(formatCompactCurrency(reserve))}.
        </div>
      </Panel>
    </ModulePage>
  );
}
