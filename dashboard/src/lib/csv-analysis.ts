import type { ImportedMonth } from "./csv.ts";
import { divide, round, variance } from "./finance.ts";
import { formatDelta, formatValue } from "./format.ts";
export type CsvStat = {
  label: string;
  value: number | null;
  unit: "currency" | "percent";
  detail: string;
  formula: string;
};
export function adjacentMonths(prior: string, current: string) {
  return (
    prior.slice(0, 4) === current.slice(0, 4) &&
    Number(current.slice(5)) - Number(prior.slice(5)) === 1
  );
}
export function analyzeCsv(rows: ImportedMonth[], selected = "all") {
  if (!rows.length) throw new Error("Keine validierten Monatsdaten vorhanden.");
  const sorted = [...rows].sort((a, b) => a.month.localeCompare(b.month));
  const chosen = selected === "all" ? sorted : sorted.filter((r) => r.month === selected);
  if (!chosen.length) throw new Error("Gewählter Monat fehlt in der Datei.");
  const latest = chosen.at(-1)!;
  const total = (key: keyof ImportedMonth): number | null => {
    const values = chosen.map((r) => r[key]);
    return values.some((v) => typeof v !== "number")
      ? null
      : round((values as number[]).reduce((a, b) => a + b, 0));
  };
  const revenue = total("revenue")!,
    ebitda = total("ebitda")!,
    ebit = total("ebit"),
    net = total("netIncome");
  const ratio = (n: number | null, d: number | null) =>
    n === null || d === null ? null : divide(n * 100, d);
  const previous = sorted.find((r) => adjacentMonths(r.month, latest.month));
  const comparison = (actual: number | null, plan: number | null, percent = false) =>
    actual === null || plan === null
      ? null
      : percent
        ? variance(actual, plan).percent
        : variance(actual, plan).absolute;
  const nwc = [latest.receivables, latest.inventory, latest.payables].some((v) => v === null)
    ? null
    : round(latest.receivables! + latest.inventory! - latest.payables!);
  const period = selected === "all" ? `${chosen[0].month} bis ${latest.month}` : latest.month;
  const stock = `Stichtag ${latest.month} · Monatsende`;
  const card = (
    label: string,
    value: number | null,
    unit: CsvStat["unit"],
    detail: string,
    formula: string,
  ): CsvStat => ({ label, value, unit, detail, formula });
  const sections = [
    {
      title: "Ertrag",
      basis: `Monatswerte · ${period}`,
      stats: [
        card(
          "Umsatz",
          revenue,
          "currency",
          period,
          "Summe der Monatsumsätze im gewählten Zeitraum",
        ),
        card("EBITDA", ebitda, "currency", period, "Umsatz − Material − Personal − Sonstiges"),
        card(
          "EBITDA-Marge",
          ratio(ebitda, revenue),
          "percent",
          "Gewichtet über den gewählten Zeitraum",
          "EBITDA / Umsatz × 100",
        ),
        card(
          "EBIT",
          ebit,
          "currency",
          period,
          "EBITDA − Abschreibungen; nur bei vollständigen Angaben",
        ),
        card(
          "Ergebnis nach Steuern",
          net,
          "currency",
          period,
          "EBIT − Nettozinsaufwand − Ertragsteuern; vereinfachte Ergebnisrechnung",
        ),
        card(
          "Nettomarge",
          ratio(net, revenue),
          "percent",
          "Ergebnis nach Steuern / Umsatz",
          "Ergebnis nach Steuern / Umsatz × 100",
        ),
      ],
    },
    {
      title: "Liquidität & Kapitalbindung",
      basis: stock,
      stats: [
        card(
          "Liquide Mittel",
          latest.cash,
          "currency",
          stock,
          "Übernommener Endbestand; kein Cashflow",
        ),
        card(
          "Forderungen",
          latest.receivables,
          "currency",
          stock,
          "Forderungen aus Lieferungen und Leistungen",
        ),
        card("Vorräte", latest.inventory, "currency", stock, "Übernommener Vorratsbestand"),
        card(
          "Net Working Capital",
          nwc,
          "currency",
          stock,
          "Forderungen + Vorräte − Lieferverbindlichkeiten",
        ),
      ],
    },
    {
      title: "Kapitalstruktur",
      basis: stock,
      stats: [
        card(
          "Eigenkapital",
          latest.equity,
          "currency",
          stock,
          "Übernommenes Eigenkapital, einschließlich möglicher Verluste",
        ),
        card("Bilanzsumme", latest.assets, "currency", stock, "Übernommene Summe der Aktiva"),
        card(
          "Eigenkapitalquote",
          ratio(latest.equity, latest.assets),
          "percent",
          stock,
          "Eigenkapital / Bilanzsumme × 100",
        ),
      ],
    },
  ];
  const comparisons = [
    card(
      "Umsatz gegen Plan",
      comparison(revenue, total("planRevenue")),
      "currency",
      period,
      "Ist-Umsatz − Planumsatz; nur bei vollständigen Planwerten",
    ),
    card(
      "EBITDA gegen Plan",
      comparison(ebitda, total("planEbitda")),
      "currency",
      period,
      "Ist-EBITDA − Plan-EBITDA; nur bei vollständigen Planwerten",
    ),
    card(
      "Umsatz zum Vormonat",
      comparison(latest.revenue, previous?.revenue ?? null, true),
      "percent",
      `${latest.month} gegen unmittelbar vorherigen Kalendermonat`,
      "(Umsatz aktuell − Umsatz Vormonat) / |Umsatz Vormonat| × 100; bei null nicht verfügbar",
    ),
    card(
      "EBITDA zum Vormonat",
      comparison(latest.ebitda, previous?.ebitda ?? null),
      "currency",
      `${latest.month} gegen unmittelbar vorherigen Kalendermonat`,
      "EBITDA aktuell − EBITDA Vormonat",
    ),
  ];
  const commentary = [
    `Im Zeitraum ${period} beträgt der Umsatz ${formatValue(revenue, "currency")}, das EBITDA ${formatValue(ebitda, "currency")}.`,
  ];
  const planGap = comparisons[0].value;
  if (planGap !== null)
    commentary.push(`Der Umsatz weicht um ${formatDelta(planGap, "currency")} vom Plan ab.`);
  if (previous && latest.receivables !== null && previous.receivables !== null) {
    const revenueGrowth = comparison(latest.revenue, previous.revenue, true),
      arGrowth = comparison(latest.receivables, previous.receivables, true);
    if (
      revenueGrowth !== null &&
      arGrowth !== null &&
      revenueGrowth > 0 &&
      arGrowth > revenueGrowth
    )
      commentary.push(
        `Im ${latest.month} wachsen die Forderungen mit ${formatValue(arGrowth, "percent")} stärker als der Umsatz mit ${formatValue(revenueGrowth, "percent")}. Das kann auf zusätzliche Kapitalbindung hinweisen; die Ursache ist aus den Summen allein nicht erkennbar.`,
      );
  }
  const unavailable = sections.flatMap((s) => s.stats).filter((s) => s.value === null).length;
  if (unavailable)
    commentary.push(
      `${unavailable} Kennzahlen sind wegen fehlender Angaben oder eines Null-Nenners nicht verfügbar. Fehlende Werte werden nicht durch null ersetzt.`,
    );
  return {
    sections,
    comparisons,
    commentary,
    period,
    latestMonth: latest.month,
    count: chosen.length,
  };
}
