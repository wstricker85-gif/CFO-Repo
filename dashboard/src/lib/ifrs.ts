/** Fictional 2026 HGB-to-IFRS adjustments, derived from one balanced journal.
 * This is a scoped management bridge, not an IFRS 1 first-time adoption model.
 */
import { z } from "zod";
import { getBalanceStatement, getIncomeStatement } from "./statements.ts";
import { round } from "./finance.ts";
export const ifrsOptionsSchema = z.strictObject({ lease: z.boolean(), development: z.boolean() });
export type IfrsOptions = z.infer<typeof ifrsOptionsSchema>;
export const ifrsDefaults: IfrsOptions = { lease: true, development: true };
export const ifrsAssumptions = {
  payment: 12000,
  months: 60,
  monthlyRate: 0.005,
  development: 18000,
  taxRate: 0.3,
} as const;
export const ifrsSources = [
  {
    label: "IFRS 16 · Leasing",
    href: "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-16-leases/",
  },
  {
    label: "IAS 38 · Immaterielle Vermögenswerte",
    href: "https://www.ifrs.org/issued-standards/list-of-standards/ias-38-intangible-assets/",
  },
  {
    label: "IAS 12 · Ertragsteuern",
    href: "https://www.ifrs.org/issued-standards/list-of-standards/ias-12-income-taxes/",
  },
  {
    label: "§ 248 Abs. 2 HGB · Aktivierungswahlrecht",
    href: "https://www.gesetze-im-internet.de/hgb/__248.html",
  },
];
export const accounts = {
  rou: "Nutzungsrecht",
  lease: "Leasingverbindlichkeit",
  development: "Entwicklungsvermögenswert",
  dta: "Aktive latente Steuern",
  dtl: "Passive latente Steuern",
  rental: "Mietaufwand",
  capitalized: "Aktivierte Eigenleistungen",
  depreciation: "Abschreibungen Nutzungsrecht",
  interest: "Zinsaufwand Leasing",
  tax: "Latenter Steueraufwand / -ertrag",
};
type Account = keyof typeof accounts;
export type AdjustmentGroup = "lease" | "development" | "tax";
export type JournalEntry = {
  id: string;
  month: number;
  group: AdjustmentGroup;
  label: string;
  debit: Account;
  credit: Account;
  amount: number;
};
export type BridgeRow = {
  id: string;
  label: string;
  hgb: number;
  lease: number;
  development: number;
  tax: number;
  delta: number;
  ifrs: number;
  kind: "detail" | "subtotal" | "total";
};
const groups: AdjustmentGroup[] = ["lease", "development", "tax"];
const sum = (values: number[]) => round(values.reduce((a, b) => a + b, 0));
const balance = (entries: JournalEntry[], account: Account) =>
  sum(
    entries.map(
      (e) => (e.debit === account ? e.amount : 0) - (e.credit === account ? e.amount : 0),
    ),
  );
const incomeAccounts: Account[] = ["rental", "capitalized", "depreciation", "interest", "tax"];
const profit = (entries: JournalEntry[]) => -sum(incomeAccounts.map((a) => balance(entries, a)));
export function getIfrsBridge(period: string, options: IfrsOptions = ifrsDefaults, ytd = true) {
  const selected = ifrsOptionsSchema.parse(options);
  const base = getBalanceStatement(period),
    income = getIncomeStatement(period, ytd);
  const count = Number(period.slice(5));
  const a = ifrsAssumptions;
  const initialLease = round((a.payment * (1 - (1 + a.monthlyRate) ** -a.months)) / a.monthlyRate);
  const monthlyDepreciation = round(initialLease / a.months);
  const journal: JournalEntry[] = [];
  const post = (
    month: number,
    group: AdjustmentGroup,
    label: string,
    debit: Account,
    credit: Account,
    amount: number,
  ) => {
    amount = round(amount);
    if (amount === 0) return;
    journal.push({
      id: `${month}-${journal.length}`,
      month,
      group,
      label,
      debit: amount > 0 ? debit : credit,
      credit: amount > 0 ? credit : debit,
      amount: Math.abs(amount),
    });
  };
  let lease = selected.lease ? initialLease : 0,
    rou = lease,
    development = 0;
  let dta = 0,
    dtl = 0;
  const taxEntries = (month: number) => {
    const nextDta = round(lease * a.taxRate),
      nextDtl = sum([round(rou * a.taxRate), round(development * a.taxRate)]);
    post(month, "tax", "Steuerwirkung Leasingverbindlichkeit", "dta", "tax", round(nextDta - dta));
    post(
      month,
      "tax",
      "Steuerwirkung Nutzungsrecht und Entwicklung",
      "tax",
      "dtl",
      round(nextDtl - dtl),
    );
    dta = nextDta;
    dtl = nextDtl;
  };
  if (selected.lease) {
    post(0, "lease", "Erstansatz zum 01.01.2026", "rou", "lease", initialLease);
    taxEntries(0);
  }
  for (let month = 1; month <= count; month++) {
    if (selected.lease) {
      const interest = round(lease * a.monthlyRate);
      post(month, "lease", "Mietaufwand umgliedern / Leasingzahlung", "lease", "rental", a.payment);
      post(month, "lease", "Leasingzins auf den Anfangsbestand", "interest", "lease", interest);
      post(
        month,
        "lease",
        "Planmäßige Abschreibung Nutzungsrecht",
        "depreciation",
        "rou",
        monthlyDepreciation,
      );
      lease = round(lease + interest - a.payment);
      rou = round(rou - monthlyDepreciation);
    }
    if (selected.development) {
      post(
        month,
        "development",
        "Qualifizierende Entwicklungskosten aktivieren",
        "development",
        "capitalized",
        a.development,
      );
      development = round(development + a.development);
    }
    taxEntries(month);
  }
  const periodEntries = journal.filter((e) => (ytd ? e.month > 0 : e.month === count));
  const groupEntries = (g: AdjustmentGroup, stock = false) =>
    (stock ? journal : periodEntries).filter((e) => e.group === g);
  const effect = (fn: (entries: JournalEntry[]) => number, stock = false) =>
    Object.fromEntries(groups.map((g) => [g, round(fn(groupEntries(g, stock)))])) as Record<
      AdjustmentGroup,
      number
    >;
  const row = (
    id: string,
    label: string,
    hgb: number,
    effects: Record<AdjustmentGroup, number>,
    kind: BridgeRow["kind"] = "detail",
  ): BridgeRow => {
    const delta = sum(Object.values(effects));
    return { id, label, hgb: round(hgb), ...effects, delta, ifrs: round(hgb + delta), kind };
  };
  const zero = { lease: 0, development: 0, tax: 0 };
  const stock = (...ids: Account[]) =>
    effect((entries) => sum(ids.map((id) => balance(entries, id))), true);
  const creditStock = (...ids: Account[]) =>
    effect((entries) => -sum(ids.map((id) => balance(entries, id))), true);
  const periodCredit = (...ids: Account[]) =>
    effect((entries) => -sum(ids.map((id) => balance(entries, id))));
  const equityEffect = effect(profit, true);
  const assetsEffect = stock("rou", "development", "dta");
  const liabilitiesEffect = effect(
    (entries) => sum([profit(entries), -balance(entries, "lease"), -balance(entries, "dtl")]),
    true,
  );
  const balanceRows: BridgeRow[] = [
    row(
      "intangibles",
      "Immaterielle Vermögenswerte",
      base.current.intangibles,
      stock("development"),
    ),
    row("rou", "Nutzungsrechte Leasing", 0, stock("rou")),
    row("dta", "Aktive latente Steuern", 0, stock("dta")),
    row(
      "other-assets",
      "Übrige Aktiva inkl. liquider Mittel",
      round(base.totals.assets - base.current.intangibles),
      zero,
    ),
    row("assets", "Summe Aktiva", base.totals.assets, assetsEffect, "total"),
    row("equity", "Eigenkapital", base.totals.equity, equityEffect, "subtotal"),
    row("lease", "Leasingverbindlichkeiten", 0, creditStock("lease")),
    row("dtl", "Passive latente Steuern", 0, creditStock("dtl")),
    row(
      "other-liabilities",
      "Übrige Schulden und Rückstellungen",
      round(base.totals.liabilities - base.totals.equity),
      zero,
    ),
    row("liabilities", "Summe Passiva", base.totals.liabilities, liabilitiesEffect, "total"),
  ];
  const incomeRows: BridgeRow[] = [
    row("revenue", "Umsatzerlöse", income.revenue, zero),
    row("capitalized", "Zusätzlich aktivierte Eigenleistungen", 0, periodCredit("capitalized")),
    row(
      "expenses",
      "Operative Aufwendungen",
      round(income.ebitda - income.revenue),
      periodCredit("rental"),
    ),
    row("ebitda", "EBITDA", income.ebitda, periodCredit("capitalized", "rental"), "subtotal"),
    row("depreciation", "Abschreibungen", -income.depreciation, periodCredit("depreciation")),
    row(
      "ebit",
      "EBIT",
      income.ebit,
      periodCredit("capitalized", "rental", "depreciation"),
      "subtotal",
    ),
    row("interest", "Zinsaufwand", -income.interest, periodCredit("interest")),
    row(
      "ebt",
      "Ergebnis vor Steuern",
      income.ebt,
      periodCredit("capitalized", "rental", "depreciation", "interest"),
      "subtotal",
    ),
    row("current-tax", "Laufende Ertragsteuern", -income.taxes, zero),
    row("deferred-tax", "Latenter Steueraufwand / -ertrag", 0, periodCredit("tax")),
    row(
      "net",
      ytd ? "Jahresergebnis bis Stichtag" : "Periodenergebnis",
      income.netIncome,
      effect(profit),
      "total",
    ),
  ];
  const assets = balanceRows.find((r) => r.id === "assets")!,
    liabilities = balanceRows.find((r) => r.id === "liabilities")!;
  const equity = balanceRows.find((r) => r.id === "equity")!,
    ebitda = incomeRows.find((r) => r.id === "ebitda")!,
    net = incomeRows.find((r) => r.id === "net")!;
  const difference = round(assets.ifrs - liabilities.ifrs);
  if (Math.abs(difference) > 0.01) throw new Error("IFRS-Demo ist nicht abgestimmt.");
  let cursor = equity.hgb;
  const stages = [{ label: "HGB", from: 0, to: cursor, value: cursor, total: true }];
  for (const [label, group] of [
    ["Leasing", "lease"],
    ["Entwicklung", "development"],
    ["Latente Steuern", "tax"],
  ] as const) {
    const value = equity[group];
    const next = round(cursor + value);
    stages.push({ label, from: cursor, to: next, value, total: false });
    cursor = next;
  }
  stages.push({ label: "IFRS-Demo", from: 0, to: equity.ifrs, value: equity.ifrs, total: true });
  return {
    period,
    options: selected,
    ytd,
    start: income.start,
    end: income.end,
    initialLease,
    monthlyDepreciation,
    closing: { lease, rou, development, dta, dtl },
    journal,
    periodEntries,
    balanceRows,
    incomeRows,
    equity,
    assets,
    ebitda,
    net,
    stages,
    difference,
    cashChange: 0,
  };
}
