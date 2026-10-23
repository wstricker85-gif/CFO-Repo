"use client";
import { liveMarketSchema } from "@/lib/market-contract";
import { Select } from "@/components/ui/Select";
import { getLocale } from "@/lib/i18n";
import { useTranslation } from "@/components/i18n/Language";
import { useState, useEffect } from "react";
import {
  getDemoMarket,
  convertCurrency,
  demoCurrencies,
  type DemoCurrency,
  type LiveMarket,
} from "@/lib/demo-market";
import { getPnl } from "@/lib/demo-company";
import { formatCompactCurrency, formatValue } from "@/lib/format";
import { downloadCsv } from "@/lib/export";
import { useDemo } from "@/components/shared/DemoProvider";
import { ModulePage, Panel } from "@/components/shared/ModulePage";
import { SummaryStat } from "@/components/shared/Visuals";

export function MarketData() {
  const { t } = useTranslation();

  const { period, snapshot } = useDemo();
  const demo = getDemoMarket(period);
  const [live, setLive] = useState<LiveMarket | null>(null);
  const [liveError, setLiveError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let active = true;
    fetch(process.env.NEXT_PUBLIC_MARKET_PATH ?? "/api/market", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: unknown) => {
        if (active) setLive(liveMarketSchema.parse(data));
      })
      .catch(() => {
        if (active) setLiveError(true);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const isLive = live !== null;
  const rates = live?.rates ?? demo.rates;
  const asOf = live?.asOf ?? demo.asOf;
  const depositRate = live?.ecbRate ?? demo.riskFree;

  const [from, setFrom] = useState<DemoCurrency>("EUR"),
    [to, setTo] = useState<DemoCurrency>("USD"),
    [amount, setAmount] = useState("100000");
  const value = Number(amount),
    valid = amount.trim() !== "" && Number.isFinite(value) && value >= 0 && value <= 1e12;
  const converted = valid ? convertCurrency(value, from, to, rates) : null;
  const medianMultiple = (7.2 + 7.7) / 2;
  const ytdEbitda = (getPnl(period, true)[5].actual / snapshot.count) * 12;
  return (
    <ModulePage
      eyebrow={t("Marktdaten")}
      title={
        <>
          {t(" Kontext gewinnen. ")}
          <em>{t("Vergleiche einordnen.")}</em>
        </>
      }
      description={t("FX-Szenarien, fiktive Vergleichsunternehmen und transparente Datenquellen.")}
      context={t("Unternehmensdaten fiktiv · Marktdaten separat gekennzeichnet")}
      action={
        <button
          className="button"
          onClick={() =>
            downloadCsv(`Marktannahmen-${isLive ? "Live" : "Demo"}-${period}.csv`, [
              [
                isLive
                  ? `EZB-REFERENZKURSE – ${live!.source}`
                  : "FIKTIVE MARKTANNAHMEN – KEINE KURSDATEN",
                asOf,
              ],
              ["Währung", "Einheiten je EUR"],
              ...demoCurrencies.map((c) => [c, rates[c]]),
              [],
              ["Fiktiver Peer", "Sektor", "EV/EBITDA", "EV/Umsatz", "Marge Prozent"],
              ...demo.peers.map((p) => [p.name, p.sector, p.evEbitda, p.evRevenue, p.margin]),
            ])
          }
        >
          {t(" Annahmen exportieren ↗ ")}
        </button>
      }
    >
      {isLive ? (
        <div className="notice-banner notice-banner--live">
          <span aria-hidden="true">◎</span>
          <p>
            <strong>{t("Live-Daten aktiv.")}</strong>{" "}
            {t(" FX-Kurse via Frankfurter.dev (EZB-Referenzkurse), Stand ")}
            {t(asOf)}
            {t(". Peer-Multiples bleiben fiktive Demo-Annahmen. ")}
          </p>
        </div>
      ) : (
        <div className="notice-banner">
          <span aria-hidden="true">↗</span>
          <p>
            <strong>{t(liveError ? "Live-Daten nicht erreichbar." : "Lade Marktdaten…")}</strong>
            {t(" ")}
            {t(
              liveError
                ? "Kurse fallen auf fiktive Demo-Annahmen zurück."
                : "FX-Kurse werden von Frankfurter.dev abgerufen.",
            )}
          </p>
        </div>
      )}
      <div className="summary-grid">
        <SummaryStat
          label={`EUR / USD · ${isLive ? "Live" : "Demo"}`}
          value={new Intl.NumberFormat(getLocale(), { minimumFractionDigits: 4 }).format(rates.USD)}
          detail={t(isLive ? `EZB-Referenzkurs · Stand ${asOf}` : "Fiktive Modellannahme")}
        />
        <SummaryStat
          label={`EUR / CHF · ${isLive ? "Live" : "Demo"}`}
          value={new Intl.NumberFormat(getLocale(), { minimumFractionDigits: 4 }).format(rates.CHF)}
          detail={t(isLive ? `EZB-Referenzkurs · Stand ${asOf}` : "Fiktive Modellannahme")}
        />
        <SummaryStat
          label={`EUR / PLN · ${isLive ? "Live" : "Demo"}`}
          value={new Intl.NumberFormat(getLocale(), { minimumFractionDigits: 4 }).format(rates.PLN)}
          detail={t(isLive ? `EZB-Referenzkurs · Stand ${asOf}` : "Fiktive Modellannahme")}
        />
        <SummaryStat
          label={`EZB-Einlagensatz · ${live?.ecbRate != null ? "Live" : "Demo"}`}
          value={formatValue(depositRate, "percent")}
          detail={t(
            live?.ecbRate != null
              ? `EZB-Einlagefazilität · Stand ${live.ecbAsOf}`
              : "Keine reale Zinskurve oder Laufzeitreferenz",
          )}
        />
        <SummaryStat
          label={"Peer-Median · Demo"}
          value={formatValue(medianMultiple, "multiple")}
          detail={t("EV/EBITDA · vier fiktive Vergleichsunternehmen")}
        />
      </div>
      <div className="module-two-column">
        <Panel index="01 / Währungsszenario" title={t("Fremdwährung umrechnen")}>
          <div className="fx-converter">
            <label>
              {t(" Betrag ")}
              <input
                type="number"
                min="0"
                max="1000000000000"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <div className="fx-currencies">
              <label>
                {t(" Von ")}
                <Select value={from} onChange={(e) => setFrom(e.target.value as DemoCurrency)}>
                  {demoCurrencies.map((c) => (
                    <option key={c} value={c}>
                      {t(c)}
                    </option>
                  ))}
                </Select>
              </label>
              <button
                className="swap-button"
                aria-label={t("Währungen tauschen")}
                onClick={() => {
                  setFrom(to);
                  setTo(from);
                }}
              >
                ⇄
              </button>
              <label>
                {t(" Nach ")}
                <Select value={to} onChange={(e) => setTo(e.target.value as DemoCurrency)}>
                  {demoCurrencies.map((c) => (
                    <option key={c} value={c}>
                      {t(c)}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <div className="fx-result" aria-live="polite">
              <span className="label">
                {t("Ergebnis mit ")}
                {t(isLive ? "Live-Kurs" : "Demo-Kurs")}
              </span>
              <strong>
                {t(
                  converted === null
                    ? "Betrag prüfen"
                    : new Intl.NumberFormat(getLocale(), {
                        style: "currency",
                        currency: to,
                        maximumFractionDigits: 2,
                      }).format(converted),
                )}
              </strong>
              <span>
                {t(
                  valid
                    ? `1 ${from} = ${new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 4 }).format(rates[to] / rates[from])} ${to}`
                    : "Bitte einen Betrag zwischen 0 und 1 Billion eingeben.",
                )}
              </span>
            </div>
            <p className="small-muted">
              {t(" Keine Gebühren, Spreads oder Wechselkurseffekte in der GuV modelliert.")}
              {t(" ")}
              {t(isLive ? `EZB-Referenzkurs, Stand ${asOf}.` : `Fiktiver Referenzstand: ${asOf}.`)}
            </p>
          </div>
        </Panel>
        <Panel index="02 / Einordnung" title={t("Multiples als Plausibilisierung")}>
          <div className="multiple-context">
            <span className="label">{t("EV beim fiktiven Peer-Median")}</span>
            <strong>{t(formatCompactCurrency(ytdEbitda * medianMultiple))}</strong>
            <p>
              {t(" Annualisiertes YTD-EBITDA von ")}
              {t(formatCompactCurrency(ytdEbitda))} ×{t(" ")}
              {t(formatValue(medianMultiple, "multiple"))}.
            </p>
            <dl>
              <div>
                <dt>{t("Unteres Demo-Multiple")}</dt>
                <dd>6,4×</dd>
              </div>
              <div>
                <dt>{t("Oberes Demo-Multiple")}</dt>
                <dd>8,1×</dd>
              </div>
              <div>
                <dt>{t("Vergleichsbasis")}</dt>
                <dd>{t("Fiktive Enterprise Values")}</dd>
              </div>
            </dl>
            <p className="small-muted">
              {t(
                " Keine eigenständige Bewertung. Branchenmix, Größenunterschiede, Verschuldung und Rechnungslegung sind nicht bereinigt. Nicht automatisch mit einem DCF-Ergebnis mitteln. ",
              )}
            </p>
          </div>
        </Panel>
      </div>
      <Panel index="03 / Peer Group" title={t("Vergleichsunternehmen der Demo")}>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label={t("Fiktive Peer Group")}
        >
          <table className="data-table">
            <caption className="sr-only">
              {t(" Ausschließlich fiktive Vergleichsunternehmen und Multiples ")}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t("Fiktives Unternehmen")}</th>
                <th scope="col">{t("Segment")}</th>
                <th scope="col" className="number-cell">
                  {t(" EV / EBITDA ")}
                </th>
                <th scope="col" className="number-cell">
                  {t(" EV / Umsatz ")}
                </th>
                <th scope="col" className="number-cell">
                  {t(" EBITDA-Marge ")}
                </th>
              </tr>
            </thead>
            <tbody>
              {demo.peers.map((p) => (
                <tr key={p.name}>
                  <th scope="row">
                    {t(p.name)}
                    <small>{t("Fiktive Referenz")}</small>
                  </th>
                  <td>{t(p.sector)}</td>
                  <td className="number-cell">{t(formatValue(p.evEbitda, "multiple"))}</td>
                  <td className="number-cell">{t(formatValue(p.evRevenue, "multiple"))}</td>
                  <td className="number-cell">{t(formatValue(p.margin, "percent"))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel index="04 / Datenanbindung" title={t("Quellen und Verfügbarkeit")}>
        <div className="source-grid">
          <div>
            <span
              className="source-state"
              data-status={isLive ? "live" : liveError ? "error" : "loading"}
            >
              {t(isLive ? "Verbunden" : liveError ? "Nicht erreichbar" : "Verbinde…")}
            </span>
            <h3>{t("Frankfurter.dev · EZB-Referenzkurse")}</h3>
            <p>
              {t(
                " Tagesaktuelle FX-Kurse (EUR/USD, CHF, GBP, PLN) direkt von der Europäischen Zentralbank über einen serverseitigen Adapter. Kein API-Schlüssel erforderlich. ",
              )}
              {t(
                live && ` Abgerufen: ${new Date(live.fetchedAt).toLocaleTimeString(getLocale())}.`,
              )}
            </p>
          </div>
          <div>
            <span
              className="source-state"
              data-status={live?.ecbRate != null ? "live" : "fallback"}
            >
              {t(live?.ecbRate != null ? "Verbunden" : "Demo-Annahme")}
            </span>
            <h3>{t("EZB · Einlagefazilität")}</h3>
            <p>
              {t(
                " EZB-Einlagefazilität als Marktindikator. Kein laufzeitgerechter risikofreier DCF-Zins; die Bewertungsannahmen bleiben unabhängig. ",
              )}
            </p>
          </div>
          <div>
            <span className="source-state" data-status="demo">
              {t(" Fiktiv ")}
            </span>
            <h3>{t("Peer-Multiples & Szenarien")}</h3>
            <p>
              {t(
                " Vergleichsunternehmen und EV-Multiples sind fiktive Demo-Annahmen — keine realen Marktbeobachtungen. Für Produktiveinsatz durch geprüfte Branchen-Benchmarks ersetzen. ",
              )}
            </p>
          </div>
        </div>
      </Panel>
    </ModulePage>
  );
}
