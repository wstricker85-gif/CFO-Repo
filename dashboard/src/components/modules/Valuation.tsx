"use client";
import { getLocale } from "@/lib/i18n";
import { useTranslation } from "@/components/i18n/Language";
import { useState } from "react";
import { calculateDcf, type DcfInputs } from "@/lib/finance";
import { getCapital, getPnl } from "@/lib/demo-company";
import { downloadCsv } from "@/lib/export";
import { formatCompactCurrency, formatValue } from "@/lib/format";
import { useDemo } from "@/components/shared/DemoProvider";
import { ModulePage, Panel } from "@/components/shared/ModulePage";
import { SummaryStat } from "@/components/shared/Visuals";

export function Valuation() {
  const { t } = useTranslation();

  const { period, snapshot } = useDemo();
  const [growth, setGrowth] = useState(4),
    [wacc, setWacc] = useState(9),
    [terminalGrowth, setTerminalGrowth] = useState(2),
    [margin, setMargin] = useState(16);
  const [scenario, setScenario] = useState("base");
  const capital = getCapital(period),
    pnl = getPnl(period, true);
  const baseRevenue = (pnl[0].actual / snapshot.count) * 12;
  const inputs: DcfInputs = {
    revenue: baseRevenue,
    margin,
    growth,
    taxRate: 30,
    depreciation: 220000,
    capex: 350000,
    workingCapitalInvestment: 100000,
    wacc,
    terminalGrowth,
    netDebt: capital.debt - capital.cash,
  };
  const result = calculateDcf(inputs);
  const discounts = [wacc - 2, wacc - 1, wacc, wacc + 1, wacc + 2];
  const growths = [growth - 2, growth - 1, growth, growth + 1, growth + 2];
  const sensitivity = growths.map((g) =>
    discounts.map((discount) =>
      discount > terminalGrowth
        ? calculateDcf({ ...inputs, growth: g, wacc: discount }).enterpriseValue
        : null,
    ),
  );
  const cells = sensitivity.flat().filter((v): v is number => v !== null);
  const low = Math.min(...cells),
    high = Math.max(...cells);
  function preset(id: string) {
    setScenario(id);
    setTerminalGrowth(2);
    if (id === "conservative") {
      setGrowth(2);
      setWacc(11);
      setMargin(14);
    } else if (id === "optimistic") {
      setGrowth(6);
      setWacc(8);
      setMargin(18);
    } else {
      setGrowth(4);
      setWacc(9);
      setMargin(16);
    }
  }
  function exportModel() {
    downloadCsv(`DCF-Demo-${period}.csv`, [
      ["DEMO-BEWERTUNG – keine Unternehmensbewertung nach IDW S1", snapshot.label],
      ["Annahme", "Wert"],
      ["Annualisierter Umsatz EUR", baseRevenue],
      ["EBITDA-Marge Prozent", margin],
      ["Umsatzwachstum Prozent", growth],
      ["WACC Prozent", wacc],
      ["Terminalwachstum Prozent", terminalGrowth],
      ["Steuerquote Prozent", 30],
      ["Basis-Abschreibungen EUR", 220000],
      ["Basis-Capex EUR", 350000],
      ["Basis-NWC-Investition EUR", 100000],
      [],
      ["Jahr", "Umsatz EUR", "EBITDA EUR", "FCF EUR", "FCF-Barwert EUR"],
      ...result.years.map((y) => [2026 + y.year, y.revenue, y.ebitda, y.fcf, y.presentValue]),
      [],
      ["Enterprise Value EUR", result.enterpriseValue],
      ["Nettofinanzschulden EUR", inputs.netDebt],
      ["Equity Value EUR", result.equityValue],
      [],
      ["Wachstum / WACC", ...discounts.map((d) => `${d} %`)],
      ...sensitivity.map((row, i) => [`${growths[i]} %`, ...row]),
    ]);
  }
  return (
    <ModulePage
      eyebrow={t("Bewertung")}
      title={
        <>
          {t(" Werttreiber modellieren. ")}
          <em>{t("Bandbreiten sehen.")}</em>
        </>
      }
      description={t(
        "Ein transparentes DCF-Demomodell mit expliziten Cashflow-Treibern und Sensitivitäten.",
      )}
      context={t("Modellannahmen")}
      action={
        <button className="button" onClick={exportModel}>
          {t(" Modell exportieren ↗ ")}
        </button>
      }
    >
      <div className="notice-banner">
        <span aria-hidden="true">◇</span>
        <p>
          <strong>{t("Interaktives Rechenbeispiel.")}</strong>{" "}
          {t(
            " Annualisierter YTD-Umsatz als Ausgangsbasis; keine geprüfte Unternehmensbewertung. Alle Annahmen sind fiktiv. ",
          )}
        </p>
      </div>
      <div className="summary-grid">
        <SummaryStat
          label={"Enterprise Value"}
          value={formatCompactCurrency(result.enterpriseValue)}
          detail={t("Barwert der operativen Cashflows inkl. Terminalwert")}
        />
        <SummaryStat
          label={"Equity Value"}
          value={formatCompactCurrency(result.equityValue)}
          detail={t("Enterprise Value abzüglich Nettofinanzschulden")}
        />
        <SummaryStat
          label={"Nettofinanzschulden"}
          value={formatCompactCurrency(inputs.netDebt)}
          detail={t("Finanzschulden abzüglich liquider Mittel")}
        />
        <SummaryStat
          label={"Terminalwert-Anteil"}
          value={formatValue(result.terminalShare, "percent")}
          detail={t("Anteil am Enterprise Value; hohe Modellabhängigkeit")}
          tone={result.terminalShare !== null && result.terminalShare > 70 ? "watch" : "neutral"}
        />
      </div>
      <div className="valuation-grid">
        <Panel index="01 / Modellsteuerung" title={t("Annahmen setzen")}>
          <div className="model-controls">
            <div className="filter-pills" role="group" aria-label={t("Bewertungsszenario")}>
              {[
                ["conservative", "Vorsichtig"],
                ["base", "Basis"],
                ["optimistic", "Chancen"],
              ].map(([id, label]) => (
                <button key={id} aria-pressed={scenario === id} onClick={() => preset(id)}>
                  {t(label)}
                </button>
              ))}
            </div>
            {[
              {
                id: "growth",
                label: "Jährliches Umsatzwachstum",
                value: growth,
                set: setGrowth,
                min: 0,
                max: 10,
              },
              {
                id: "margin",
                label: "EBITDA-Marge",
                value: margin,
                set: setMargin,
                min: 8,
                max: 24,
              },
              {
                id: "wacc",
                label: "WACC / Diskontsatz",
                value: wacc,
                set: setWacc,
                min: 6,
                max: 14,
              },
              {
                id: "terminal",
                label: "Ewiges Wachstum",
                value: terminalGrowth,
                set: setTerminalGrowth,
                min: 0,
                max: 3,
              },
            ].map((input) => (
              <div className="model-input" key={input.id}>
                <label className="range-label" htmlFor={input.id}>
                  {t(input.label)}
                  <strong>{t(formatValue(input.value, "percent"))}</strong>
                </label>
                <input
                  type="range"
                  id={input.id}
                  min={input.min}
                  max={input.max}
                  step="0.5"
                  value={input.value}
                  onChange={(e) => {
                    input.set(Number(e.target.value));
                    setScenario("custom");
                  }}
                />
                <div className="range-endpoints">
                  <span>{input.min} %</span>
                  <span>{input.max} %</span>
                </div>
              </div>
            ))}
            <dl className="model-assumptions">
              <div>
                <dt>{t("Steuerquote (Demo)")}</dt>
                <dd>30 %</dd>
              </div>
              <div>
                <dt>{t("Abschreibungen Basisjahr")}</dt>
                <dd>{t("220 Tsd. €")}</dd>
              </div>
              <div>
                <dt>{t("Investitionen Basisjahr")}</dt>
                <dd>{t("350 Tsd. €")}</dd>
              </div>
              <div>
                <dt>{t("NWC-Investition Basisjahr")}</dt>
                <dd>{t("100 Tsd. €")}</dd>
              </div>
            </dl>
            <p className="small-muted">
              {t(
                " Abschreibungen, Investitionen und NWC-Investitionen wachsen proportional zum Umsatz. Konstante EBITDA-Marge. Bewertungszeitpunkt: Ende 2026; Prognose 2027–2031. ",
              )}
            </p>
          </div>
        </Panel>
        <Panel
          index="02 / Sensitivität"
          title={t("Wie robust ist der Wert?")}
          action={<span className="panel-period">{t("Enterprise Value · Mio. €")}</span>}
        >
          <div className="sensitivity-wrap">
            <p className="small-muted">{t("Zeilen: jährliches Umsatzwachstum · Spalten: WACC")}</p>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label={t("DCF-Sensitivität")}
            >
              <table className="sensitivity-table">
                <caption className="sr-only">
                  {t(" Enterprise Value bei veränderten Wachstums- und Diskontannahmen ")}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{t("Wachstum / WACC")}</th>
                    {discounts.map((d) => (
                      <th key={d} scope="col">
                        {t(formatValue(d, "percent"))}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensitivity.map((row, i) => (
                    <tr key={growths[i]}>
                      <th scope="row">{t(formatValue(growths[i], "percent"))}</th>
                      {row.map((value, j) => (
                        <td
                          key={j}
                          className={i === 2 && j === 2 ? "selected-cell" : ""}
                          style={{
                            backgroundColor:
                              value === null
                                ? "transparent"
                                : `color-mix(in srgb, var(--series-1) ${12 + ((value - low) / (high - low || 1)) * 30}%, transparent)`,
                          }}
                        >
                          <span className="sr-only">{t("Enterprise Value ")}</span>
                          {t(
                            value === null
                              ? "n. v."
                              : new Intl.NumberFormat(getLocale(), {
                                  maximumFractionDigits: 2,
                                  minimumFractionDigits: 2,
                                }).format(value / 1e6),
                          )}
                          {i === 2 && j === 2 && (
                            <span className="sr-only">{t(", gewähltes Szenario")}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sensitivity-range">
              <div>
                <span className="label">{t("Unteres Modellband")}</span>
                <strong>{t(formatCompactCurrency(low))}</strong>
              </div>
              <div>
                <span className="label">{t("Oberes Modellband")}</span>
                <strong>{t(formatCompactCurrency(high))}</strong>
              </div>
            </div>
            <p className="small-muted">
              {t(
                " Bandbreite aus der dargestellten Matrix, kein statistisches Konfidenzintervall. Ewiges Wachstum bleibt bei ",
              )}
              {t(formatValue(terminalGrowth, "percent"))}.
            </p>
          </div>
          <div className="panel-note">
            {t(
              " Terminalwert: FCF₅ × (1 + g) / (WACC − g). Der WACC liegt für alle gültigen Zellen über dem ewigen Wachstum. ",
            )}
          </div>
        </Panel>
      </div>
      <Panel index="03 / Cashflow-Modell" title={t("Fünf Jahre, offen gerechnet")}>
        <div className="table-scroll" tabIndex={0} role="region" aria-label={t("DCF-Prognose")}>
          <table className="data-table">
            <caption className="sr-only">{t("Fiktive DCF-Prognose in Euro")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("Position")}</th>
                {result.years.map((y) => (
                  <th className="number-cell" key={y.year} scope="col">
                    {2026 + y.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Umsatz", key: "revenue" },
                { label: "EBITDA", key: "ebitda" },
                { label: "Steuern auf EBIT", key: "tax" },
                { label: "Investitionen", key: "capex" },
                { label: "NWC-Investition", key: "workingCapital" },
                { label: "Free Cashflow", key: "fcf" },
                { label: "Barwert Free Cashflow", key: "presentValue" },
              ].map((row) => (
                <tr key={row.key} className={row.key === "fcf" ? "emphasis-row" : ""}>
                  <th scope="row">{t(row.label)}</th>
                  {result.years.map((y) => (
                    <td className="number-cell" key={y.year}>
                      {t(formatCompactCurrency(y[row.key as "revenue"]))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-note">
          <span>{t("FCF = EBIT − Steuern + Abschreibungen − Capex − ΔNWC.")}</span>
          <span>{t("Keine steuerlichen Verlustvorträge modelliert.")}</span>
        </div>
      </Panel>
    </ModulePage>
  );
}
