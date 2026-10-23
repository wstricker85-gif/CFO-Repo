import { demoSnapshots, revenueHistory } from "./demo-data.ts";
import { getPnl } from "./demo-company.ts";
import {
  balanceTotals,
  getBalanceSeed,
  statementMovements,
  type BalanceSeed,
} from "./demo-ledger.ts";
import { divide, round, variance } from "./finance.ts";

export type StatementLine = {
  id: string;
  label: string;
  value: number;
  kind: "detail" | "subtotal" | "total";
  description: string;
  budget?: number;
  depth?: number;
};
function snapshotFor(period: string) {
  const snapshot = demoSnapshots.find((s) => s.id === period);
  if (!snapshot) throw new Error(`Keine Auswertung für ${period} vorhanden.`);
  return snapshot;
}
const sum = (values: number[]) => round(values.reduce((a, b) => a + b, 0));

export function getIncomeStatement(period: string, ytd = false) {
  const snapshot = snapshotFor(period);
  const pnl = getPnl(period, ytd);
  const movements = ytd
    ? statementMovements.slice(0, snapshot.count)
    : [statementMovements[snapshot.count - 1]];
  const depreciation = sum(movements.map((m) => m.depreciation));
  const interest = sum(movements.map((m) => m.interestExpense));
  const budgetDepreciation = sum(movements.map((m) => m.budgetDepreciation));
  const budgetInterest = sum(movements.map((m) => m.budgetInterestExpense));
  const ebitda = pnl[5].actual,
    ebit = round(ebitda - depreciation),
    ebt = round(ebit - interest);
  const planEbit = round(pnl[5].budget - budgetDepreciation),
    planEbt = round(planEbit - budgetInterest);
  // Compute taxes monthly before summing: no cross-period loss offsets assumed.
  const taxes = sum(
    movements.map((m) => {
      const index = statementMovements.indexOf(m);
      return round(
        (Math.max(0, revenueHistory[index].ebitda - m.depreciation - m.interestExpense) *
          m.taxRate) /
          100,
      );
    }),
  );
  const budgetTaxes = ytd
    ? sum(
        statementMovements.slice(0, snapshot.count).map((m, i) => {
          // The original plan's monthly EBITDA is the difference between successive YTD totals.
          const total = i === snapshot.count - 1 ? pnl[5].budget : plannedEbitdaThrough(i + 1);
          const prior = i === 0 ? 0 : plannedEbitdaThrough(i);
          return round(
            (Math.max(0, total - prior - m.budgetDepreciation - m.budgetInterestExpense) *
              m.taxRate) /
              100,
          );
        }),
      )
    : round((Math.max(0, planEbt) * movements[0].taxRate) / 100);
  const netIncome = round(ebt - taxes),
    planNetIncome = round(planEbt - budgetTaxes);
  const line = (
    id: string,
    label: string,
    value: number,
    budget: number,
    kind: StatementLine["kind"],
    description: string,
  ): StatementLine => ({ id, label, value, budget, kind, description });
  const rows = [
    line(
      "revenue",
      "Umsatzerlöse",
      pnl[0].actual,
      pnl[0].budget,
      "detail",
      "Erfasste Umsatzerlöse im gewählten Zeitraum.",
    ),
    line(
      "inventory-change",
      "Bestandsveränderungen / aktivierte Eigenleistungen",
      0,
      0,
      "detail",
      "In dieser vereinfachten Management-GuV nicht vorhanden. Die Bilanzvorräte sind Materialbestände.",
    ),
    line(
      "other-income",
      "Sonstige betriebliche Erträge",
      0,
      0,
      "detail",
      "Keine weiteren betrieblichen Erträge in den Beispieldaten.",
    ),
    line(
      "output",
      "Gesamtleistung",
      pnl[0].actual,
      pnl[0].budget,
      "subtotal",
      "Umsatz zuzüglich der hier mit null modellierten sonstigen Leistungspositionen.",
    ),
    line(
      "material",
      "Material & Fremdleistungen",
      -pnl[1].actual,
      -pnl[1].budget,
      "detail",
      "Operativer Material- und Fremdleistungsaufwand, als negativer Ergebnisbeitrag dargestellt.",
    ),
    line(
      "gross",
      "Rohertrag",
      pnl[2].actual,
      pnl[2].budget,
      "subtotal",
      "Gesamtleistung abzüglich Material und Fremdleistungen.",
    ),
    line(
      "personnel",
      "Personalaufwand",
      -pnl[3].actual,
      -pnl[3].budget,
      "detail",
      "Personalaufwand der Periode, nicht der Personalbestand in FTE.",
    ),
    line(
      "overhead",
      "Sonstiger Betriebsaufwand",
      -pnl[4].actual,
      -pnl[4].budget,
      "detail",
      "Weitere operative Aufwendungen vor Abschreibungen, Zinsen und Ertragsteuern.",
    ),
    line(
      "ebitda",
      "EBITDA",
      ebitda,
      pnl[5].budget,
      "subtotal",
      "Rohertrag abzüglich Personal und sonstiger operativer Aufwendungen.",
    ),
    line(
      "depreciation",
      "Abschreibungen",
      -depreciation,
      -budgetDepreciation,
      "detail",
      "Planmäßige Abschreibungen auf immaterielle Vermögenswerte und Sachanlagen; nicht zahlungswirksam.",
    ),
    line(
      "ebit",
      "EBIT / Betriebsergebnis",
      ebit,
      planEbit,
      "subtotal",
      "EBITDA abzüglich Abschreibungen.",
    ),
    line(
      "interest",
      "Zinsaufwand / Finanzergebnis",
      -interest,
      -budgetInterest,
      "detail",
      "Die Demo enthält Zinsaufwand, aber keine Zinserträge oder weiteren Finanzpositionen.",
    ),
    line(
      "ebt",
      "Ergebnis vor Steuern",
      ebt,
      planEbt,
      "subtotal",
      "Betriebsergebnis nach Zinsaufwand, vor Ertragsteuern.",
    ),
    line(
      "tax",
      "Steuern vom Einkommen und Ertrag",
      -taxes,
      -budgetTaxes,
      "detail",
      "Vereinfachte Demo-Steuerquote von 30 % auf positive monatliche Ergebnisse; keine Verlustverrechnung modelliert.",
    ),
    line(
      "net",
      ytd ? "Jahresergebnis bis Stichtag" : "Periodenergebnis",
      netIncome,
      planNetIncome,
      "total",
      "Ergebnis nach modellierten Ertragsteuern. Es fließt ohne Ausschüttungen in das Eigenkapital ein.",
    ),
  ];
  return {
    rows,
    revenue: pnl[0].actual,
    ebitda,
    depreciation,
    ebit,
    interest,
    ebt,
    taxes,
    netIncome,
    planNetIncome,
    netVariance: variance(netIncome, planNetIncome),
    ebitMargin: divide(ebit * 100, pnl[0].actual),
    netMargin: divide(netIncome * 100, pnl[0].actual),
    start: ytd ? "2026-01-01" : snapshot.result.period.start,
    end: snapshot.end,
    ytd,
  };
}
function plannedEbitdaThrough(count: number) {
  if (count >= 8) return getPnl(`2026-${String(count).padStart(2, "0")}`, true)[5].budget;
  return sum(
    revenueHistory
      .slice(0, count)
      .map((m, i) => round(m.budget - m.budget * 0.54 - (225000 + i * 1000) - m.budget * 0.11)),
  );
}

export function getIncomeHistory(period: string) {
  const snapshot = snapshotFor(period);
  return revenueHistory.slice(0, snapshot.count).map((m, i) => {
    const movement = statementMovements[i];
    const ebit = round(m.ebitda - movement.depreciation),
      ebt = round(ebit - movement.interestExpense);
    const taxes = round((Math.max(0, ebt) * movement.taxRate) / 100);
    return { month: m.month, ebitda: m.ebitda, ebit, netIncome: round(ebt - taxes) };
  });
}

export function getBalanceStatement(period: string, comparison: "prior" | "opening" = "prior") {
  const snapshot = snapshotFor(period);
  const current = getBalanceSeed(period);
  const priorPeriod =
    comparison === "opening" ? "2025-12" : `2026-${String(snapshot.count - 1).padStart(2, "0")}`;
  const previous = getBalanceSeed(priorPeriod);
  const totals = balanceTotals(current),
    previousTotals = balanceTotals(previous);
  const line = (
    id: string,
    label: string,
    select: (b: BalanceSeed) => number,
    kind: StatementLine["kind"],
    description: string,
    depth = 0,
  ) => ({
    id,
    label,
    value: round(select(current)),
    previous: round(select(previous)),
    kind,
    description,
    depth,
  });
  const assets = [
    line(
      "intangibles",
      "Immaterielle Vermögenswerte",
      (b) => b.intangibles,
      "detail",
      "Buchwerte der immateriellen Werte nach Abschreibungen.",
      1,
    ),
    line(
      "tangible",
      "Sachanlagen",
      (b) => b.tangibleAssets,
      "detail",
      "Sachanlage-Buchwerte; Zugänge und Abschreibungen werden mit dem Cashflow abgestimmt.",
      1,
    ),
    line(
      "financial",
      "Finanzanlagen",
      (b) => b.financialAssets,
      "detail",
      "Langfristige Finanzanlagen; in der Demo ohne Zu- oder Abgänge.",
      1,
    ),
    line(
      "noncurrent",
      "Anlagevermögen",
      (b) => balanceTotals(b).noncurrentAssets,
      "subtotal",
      "Summe aus immateriellen Werten, Sachanlagen und Finanzanlagen.",
    ),
    line(
      "inventory",
      "Vorräte",
      (b) => b.inventory,
      "detail",
      "Materialbestände am Stichtag; ein Anstieg bindet bei sonst gleichen Bedingungen Liquidität.",
      1,
    ),
    line(
      "receivables",
      "Forderungen aus Lieferungen und Leistungen",
      (b) => b.receivables,
      "detail",
      "Offene Kundenforderungen. Die Summe stimmt mit der Offene-Posten-Demo überein.",
      1,
    ),
    line(
      "other-current",
      "Sonstige kurzfristige Vermögenswerte",
      (b) => b.otherCurrentAssets,
      "detail",
      "Weitere kurzfristige operative Vermögenswerte ohne Veränderung im Demozeitraum.",
      1,
    ),
    line(
      "cash",
      "Liquide Mittel",
      (b) => b.cash,
      "detail",
      "Frei verfügbare Bank- und Kassenbestände; entspricht dem Endbestand der Cashflow-Rechnung.",
      1,
    ),
    line(
      "current",
      "Umlaufvermögen",
      (b) => balanceTotals(b).currentAssets,
      "subtotal",
      "Summe der kurzfristigen Vermögenswerte inklusive liquider Mittel.",
    ),
    line(
      "total-assets",
      "Summe Aktiva",
      (b) => balanceTotals(b).assets,
      "total",
      "Anlagevermögen plus Umlaufvermögen; muss der Summe Passiva entsprechen.",
    ),
  ];
  const liabilities = [
    line(
      "share-capital",
      "Gezeichnetes Kapital",
      (b) => b.shareCapital,
      "detail",
      "Unverändertes Stammkapital der fiktiven Gesellschaft.",
      1,
    ),
    line(
      "capital-reserves",
      "Kapitalrücklage",
      (b) => b.capitalReserves,
      "detail",
      "Unveränderte Kapitalrücklage im Demozeitraum.",
      1,
    ),
    line(
      "retained",
      "Gewinnvortrag",
      (b) => b.retainedEarnings,
      "detail",
      "Gewinnvortrag aus Vorperioden; keine Ausschüttungen in der Demo.",
      1,
    ),
    line(
      "result",
      "Jahresergebnis bis Stichtag",
      (b) => b.ytdNetIncome,
      "detail",
      "Kumuliertes Ergebnis nach Steuern; identisch zur YTD-GuV.",
      1,
    ),
    line(
      "equity",
      "Eigenkapital",
      (b) => balanceTotals(b).equity,
      "subtotal",
      "Kapital und Rücklagen zuzüglich des laufenden Jahresergebnisses.",
    ),
    line(
      "long-debt",
      "Langfristige Finanzverbindlichkeiten",
      (b) => b.longDebt,
      "detail",
      "Langfristiger Teil der Finanzschulden; keine nicht zahlungswirksamen Umbuchungen in der Demo.",
      1,
    ),
    line(
      "long-provisions",
      "Langfristige Rückstellungen",
      (b) => b.longProvisions,
      "detail",
      "Explizit hinterlegte fiktive Abschlussbestände. Die Veränderung wird im indirekten Cashflow korrigiert.",
      1,
    ),
    line(
      "short-debt",
      "Kurzfristige Finanzverbindlichkeiten",
      (b) => b.shortDebt,
      "detail",
      "Kurzfristige Finanzschulden; Veränderungen sind zahlungswirksame Nettotilgungen der Demo.",
      1,
    ),
    line(
      "payables",
      "Verbindlichkeiten aus Lieferungen und Leistungen",
      (b) => b.payables,
      "detail",
      "Operative Lieferverbindlichkeiten; Bestandsänderungen wirken im operativen Cashflow.",
      1,
    ),
    line(
      "short-provisions",
      "Kurzfristige Rückstellungen",
      (b) => b.shortProvisions,
      "detail",
      "Kurzfristige fiktive Abschlussrückstellungen; Bewegung im operativen Cashflow berücksichtigt.",
      1,
    ),
    line(
      "tax-payable",
      "Ertragsteuerverbindlichkeiten",
      (b) => b.taxPayable,
      "detail",
      "Noch nicht gezahlte Ertragsteuern. Aufwand und Zahlung unterscheiden sich um die Bestandsänderung.",
      1,
    ),
    line(
      "other-liabilities",
      "Sonstige kurzfristige Verbindlichkeiten",
      (b) => b.otherCurrentLiabilities,
      "detail",
      "Weitere operative Verbindlichkeiten, ohne Finanzschulden oder Ertragsteuern.",
      1,
    ),
    line(
      "liabilities",
      "Fremdkapital",
      (b) => balanceTotals(b).currentLiabilities + balanceTotals(b).longLiabilities,
      "subtotal",
      "Finanzschulden, operative Verbindlichkeiten und Rückstellungen.",
    ),
    line(
      "total-liabilities",
      "Summe Passiva",
      (b) => balanceTotals(b).liabilities,
      "total",
      "Eigen- und Fremdkapital; stimmt mit der Summe Aktiva überein.",
    ),
  ];
  const difference = round(totals.assets - totals.liabilities);
  if (Math.abs(difference) > 0.01) throw new Error("Die Demo-Bilanz ist nicht ausgeglichen.");
  return {
    current,
    previous,
    assets,
    liabilities,
    totals,
    previousTotals,
    difference,
    equityRatio: divide(totals.equity * 100, totals.assets),
    assetCoverage: divide((totals.equity + totals.longLiabilities) * 100, totals.noncurrentAssets),
    netDebt: current.longDebt + current.shortDebt - current.cash,
    assetChange: round(totals.assets - previousTotals.assets),
    workingAssets: round(current.inventory + current.receivables),
    workingCapitalChange: round(
      current.receivables +
        current.inventory -
        current.payables -
        (previous.receivables + previous.inventory - previous.payables),
    ),
    grossDebt: round(current.shortDebt + current.longDebt),
  };
}

export function getCashflowStatement(period: string, ytd = false) {
  const snapshot = snapshotFor(period);
  const current = getBalanceSeed(period);
  const opening = getBalanceSeed(
    ytd ? "2025-12" : `2026-${String(snapshot.count - 1).padStart(2, "0")}`,
  );
  const income = getIncomeStatement(period, ytd);
  const movements = ytd
    ? statementMovements.slice(0, snapshot.count)
    : [statementMovements[snapshot.count - 1]];
  const change = (key: keyof Omit<BalanceSeed, "period" | "date">) =>
    round(current[key] - opening[key]);
  const line = (id: string, label: string, value: number, description: string): StatementLine => ({
    id,
    label,
    value: round(value),
    description,
    kind: "detail",
  });
  const operatingRows = [
    line(
      "net-income",
      "Ergebnis nach Steuern",
      income.netIncome,
      "Ausgangspunkt der indirekten Überleitung; identisch zur ausgewählten GuV.",
    ),
    line(
      "depreciation",
      "+ Abschreibungen",
      income.depreciation,
      "Nicht zahlungswirksamer Aufwand wird wieder hinzugerechnet.",
    ),
    line(
      "provisions",
      "+/− Veränderung der Rückstellungen",
      change("shortProvisions") + change("longProvisions"),
      "Zunahmen werden hinzugerechnet, Abnahmen abgezogen; keine weiteren nicht zahlungswirksamen Bewegungen modelliert.",
    ),
    line(
      "receivables",
      "−/+ Veränderung der Forderungen",
      -change("receivables"),
      "Zunehmende Kundenforderungen binden Cash; abnehmende setzen Cash frei.",
    ),
    line(
      "inventory",
      "−/+ Veränderung der Vorräte",
      -change("inventory"),
      "Zunehmende Materialbestände binden Cash.",
    ),
    line(
      "other-assets",
      "−/+ Sonstige kurzfristige Vermögenswerte",
      -change("otherCurrentAssets"),
      "Operative Bestandsveränderung ohne liquide Mittel.",
    ),
    line(
      "payables",
      "+/− Veränderung der Lieferverbindlichkeiten",
      change("payables"),
      "Zunehmende Lieferverbindlichkeiten entlasten den Cashflow der Periode.",
    ),
    line(
      "other-liabilities",
      "+/− Sonstige operative Verbindlichkeiten",
      change("otherCurrentLiabilities"),
      "Nur operative Verbindlichkeiten; Finanzschulden gehören in die Finanzierung.",
    ),
    line(
      "tax-payable",
      "+/− Veränderung der Ertragsteuerverbindlichkeiten",
      change("taxPayable"),
      "Überleitung von Steueraufwand zu Steuerzahlungen. Bereits im Ergebnis enthaltene Steuern werden nicht doppelt abgezogen.",
    ),
  ];
  const investingRows = [
    line(
      "capex",
      "Investitionen in Sachanlagen",
      -sum(movements.map((m) => m.capex)),
      "Auszahlungen für Anlagenzugänge. Keine Verkäufe, Zuschreibungen oder sonstigen nicht zahlungswirksamen Anlagenbewegungen.",
    ),
  ];
  const financingRows = [
    line(
      "debt",
      "Nettotilgung von Finanzverbindlichkeiten",
      change("shortDebt") + change("longDebt"),
      "Nur zahlungswirksame Änderung der Finanzschulden. Keine Ausschüttungen oder Kapitaleinlagen im Zeitraum.",
    ),
  ];
  const operating = sum(operatingRows.map((r) => r.value)),
    investing = sum(investingRows.map((r) => r.value)),
    financing = sum(financingRows.map((r) => r.value));
  const cashChange = sum([operating, investing, financing]);
  const closingCash = round(opening.cash + cashChange);
  const reconciliation = round(closingCash - current.cash);
  if (Math.abs(reconciliation) > 0.01)
    throw new Error("Cashflow und Bilanzbestand stimmen nicht überein.");
  return {
    operatingRows,
    investingRows,
    financingRows,
    operating,
    investing,
    financing,
    cashChange,
    freeCashflow: round(operating + investing),
    openingCash: opening.cash,
    closingCash,
    reconciliation,
    openingDate: opening.date,
    end: current.date,
    ytd,
    ebitda: income.ebitda,
    netIncome: income.netIncome,
    cashConversion: divide(operating * 100, income.ebitda),
    bridge: [
      { label: "Anfangsbestand", from: 0, to: opening.cash, value: opening.cash, total: true },
      {
        label: "Operativ",
        from: opening.cash,
        to: round(opening.cash + operating),
        value: operating,
        total: false,
      },
      {
        label: "Investition",
        from: round(opening.cash + operating),
        to: round(opening.cash + operating + investing),
        value: investing,
        total: false,
      },
      {
        label: "Finanzierung",
        from: round(opening.cash + operating + investing),
        to: closingCash,
        value: financing,
        total: false,
      },
      { label: "Endbestand", from: 0, to: closingCash, value: closingCash, total: true },
    ],
    taxesPaid: round(income.taxes - change("taxPayable")),
    interestPaid: income.interest,
    workingCapitalEffect: sum(
      operatingRows
        .filter((r) => ["receivables", "inventory", "payables"].includes(r.id))
        .map((r) => r.value),
    ),
  };
}
