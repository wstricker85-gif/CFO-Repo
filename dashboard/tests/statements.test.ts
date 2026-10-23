import test from "node:test";
import assert from "node:assert/strict";
import {
  balanceSeeds,
  balanceTotals,
  getBalanceSeed,
  statementMovements,
} from "../src/lib/demo-ledger.ts";
import {
  getBalanceStatement,
  getCashflowStatement,
  getIncomeHistory,
  getIncomeStatement,
} from "../src/lib/statements.ts";
import { getCapital, getInvoices, getPnl } from "../src/lib/demo-company.ts";
import { demoSnapshots } from "../src/lib/demo-data.ts";
import { buildReport } from "../src/lib/report.ts";
import { summaryInsight } from "../src/lib/insights.ts";
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 0.011, `${actual} != ${expected}`);

test("all ten independent closing fixtures have equal assets and liabilities", () => {
  assert.equal(balanceSeeds.length, 10);
  for (const balance of balanceSeeds) {
    const totals = balanceTotals(balance);
    close(totals.assets, totals.liabilities);
    assert.ok(totals.assets > 0 && totals.equity > 0);
    close(
      balance.shortDebt +
        balance.payables +
        balance.shortProvisions +
        balance.taxPayable +
        balance.otherCurrentLiabilities,
      totals.currentLiabilities,
    );
  }
});
test("fixed assets roll forward by explicit capex less recorded depreciation", () => {
  for (let i = 1; i < balanceSeeds.length; i++) {
    const previous = balanceSeeds[i - 1],
      current = balanceSeeds[i],
      movement = statementMovements[i - 1];
    close(
      current.tangibleAssets + current.intangibles,
      previous.tangibleAssets + previous.intangibles + movement.capex - movement.depreciation,
    );
    assert.equal(current.financialAssets, previous.financialAssets);
  }
});
test("every monthly net result accumulates into equity, with no silent distributions", () => {
  const history = getIncomeHistory("2026-09");
  for (let i = 1; i < balanceSeeds.length; i++) {
    const prior = balanceSeeds[i - 1],
      current = balanceSeeds[i];
    close(current.ytdNetIncome - prior.ytdNetIncome, history[i - 1].netIncome);
    close(balanceTotals(current).equity - balanceTotals(prior).equity, history[i - 1].netIncome);
  }
});
test("all P&L stages reconcile both actual and plan, month and YTD", () => {
  for (const period of ["2026-08", "2026-09"])
    for (const ytd of [false, true]) {
      const result = getIncomeStatement(period, ytd);
      for (const key of ["value", "budget"] as const) {
        const value = (id: string) => result.rows.find((r) => r.id === id)![key]!;
        close(
          value("revenue") + value("inventory-change") + value("other-income"),
          value("output"),
        );
        close(value("output") + value("material"), value("gross"));
        close(value("gross") + value("personnel") + value("overhead"), value("ebitda"));
        close(value("ebitda") + value("depreciation"), value("ebit"));
        close(value("ebit") + value("interest"), value("ebt"));
        close(value("ebt") + value("tax"), value("net"));
        for (const id of ["material", "personnel", "overhead", "depreciation", "interest", "tax"])
          assert.ok(value(id) <= 0);
      }
      close(result.ebitda, getPnl(period, ytd)[5].actual);
      close(result.netIncome, result.ebt - result.taxes);
    }
});
test("September reference result is 122500 EUR after depreciation, interest and tax", () => {
  const result = getIncomeStatement("2026-09");
  assert.equal(result.ebitda, 210000);
  assert.equal(result.depreciation, 24000);
  assert.equal(result.ebit, 186000);
  assert.equal(result.interest, 11000);
  assert.equal(result.ebt, 175000);
  assert.equal(result.taxes, 52500);
  assert.equal(result.netIncome, 122500);
  assert.equal(result.planNetIncome, 105000);
});
test("YTD September minus YTD August equals September month for every GuV line", () => {
  const august = getIncomeStatement("2026-08", true),
    september = getIncomeStatement("2026-09", true),
    month = getIncomeStatement("2026-09");
  for (const row of month.rows)
    for (const key of ["value", "budget"] as const)
      close(
        september.rows.find((r) => r.id === row.id)![key]! -
          august.rows.find((r) => r.id === row.id)![key]!,
        row[key]!,
      );
});
test("balance date comparisons are stocks, and current profit matches the YTD GuV", () => {
  for (const period of ["2026-08", "2026-09"]) {
    const balance = getBalanceStatement(period);
    close(balance.current.ytdNetIncome, getIncomeStatement(period, true).netIncome);
    assert.equal(getBalanceStatement(period, "opening").previous.date, "2025-12-31");
    assert.equal(balance.current.cash, getCapital(period).cash);
    close(balance.totals.assets, getCapital(period).totalAssets);
    close(balance.totals.equity, getCapital(period).equity);
    close(
      balance.current.receivables,
      getInvoices(period).reduce((sum, r) => sum + r.amount, 0),
    );
    assert.equal(new Set(balance.assets.map((r) => r.id)).size, balance.assets.length);
  }
  assert.equal(getBalanceStatement("2026-08").previous.date, "2026-07-31");
  assert.equal(getBalanceStatement("2026-09").previous.date, "2026-08-31");
});
test("cashflow reconciles to the bank and the selected P&L in every period", () => {
  for (const period of ["2026-08", "2026-09"])
    for (const ytd of [false, true]) {
      const cash = getCashflowStatement(period, ytd);
      close(
        cash.operatingRows.reduce((sum, r) => sum + r.value, 0),
        cash.operating,
      );
      close(cash.operating + cash.investing + cash.financing, cash.cashChange);
      close(cash.openingCash + cash.cashChange, cash.closingCash);
      assert.equal(cash.closingCash, getBalanceSeed(period).cash);
      close(cash.netIncome, getIncomeStatement(period, ytd).netIncome);
      assert.equal(cash.reconciliation, 0);
      close(cash.freeCashflow, cash.operating + cash.investing);
    }
});
test("September cashflow reference: 184k operating, -60k investing, -50k financing", () => {
  const cash = getCashflowStatement("2026-09");
  assert.equal(cash.operating, 184000);
  assert.equal(cash.investing, -60000);
  assert.equal(cash.financing, -50000);
  assert.equal(cash.openingCash, 768000);
  assert.equal(cash.cashChange, 74000);
  assert.equal(cash.closingCash, 842000);
  assert.equal(cash.taxesPaid, 37500);
  assert.equal(cash.interestPaid, 11000);
});
test("indirect cashflow has correct working-capital signs and does not double deduct tax", () => {
  const cash = getCashflowStatement("2026-09"),
    before = getBalanceSeed("2026-08"),
    after = getBalanceSeed("2026-09");
  const row = (id: string) => cash.operatingRows.find((r) => r.id === id)!.value;
  close(row("receivables"), before.receivables - after.receivables);
  close(row("inventory"), before.inventory - after.inventory);
  close(row("payables"), after.payables - before.payables);
  close(
    cash.taxesPaid,
    getIncomeStatement("2026-09").taxes - (after.taxPayable - before.taxPayable),
  );
  assert.ok(row("receivables") < 0 && row("inventory") < 0 && row("payables") > 0);
});
test("cashflow YTD movements are additive and waterfall endpoints tie", () => {
  const august = getCashflowStatement("2026-08", true),
    september = getCashflowStatement("2026-09", true),
    month = getCashflowStatement("2026-09");
  for (const key of [
    "operating",
    "investing",
    "financing",
    "cashChange",
    "taxesPaid",
    "interestPaid",
  ] as const)
    close(september[key] - august[key], month[key]);
  assert.equal(september.openingCash, 600000);
  for (const cash of [month, september]) {
    close(cash.bridge[0].to, cash.openingCash);
    close(cash.bridge.at(-1)!.to, cash.closingCash);
    for (let i = 1; i < 4; i++) {
      close(cash.bridge[i].from, cash.bridge[i - 1].to);
      close(cash.bridge[i].to - cash.bridge[i].from, cash.bridge[i].value);
    }
  }
});
test("new accounting summaries are shared by report and tooltips", () => {
  for (const snapshot of demoSnapshots) {
    const report = buildReport(snapshot, {
      full: true,
      includeCash: true,
      includeRisks: true,
      notes: "",
    });
    assert.ok(report.markdown.includes("## Bilanz, GuV und historischer Cashflow"));
    close(report.statementSummary[0].value, getIncomeStatement(snapshot.id).netIncome);
    close(
      report.statementSummary.find((r) => r.label === "Veränderung liquide Mittel im Monat")!.value,
      getCashflowStatement(snapshot.id).cashChange,
    );
  }
  for (const label of [
    "Bilanzsumme",
    "Eigenkapitalquote",
    "Anlagendeckung II",
    "EBIT / Betriebsergebnis",
    "Ergebnis nach Steuern",
    "Nettoergebnismarge",
    "Operativer Cashflow",
    "Free Cashflow",
    "Veränderung liquide Mittel",
    "Endbestand liquide Mittel",
  ])
    assert.ok(summaryInsight(label, "123", "Beispieldaten"));
});
test("unknown statement periods fail instead of silently returning another month", () => {
  for (const period of ["2026-13", "2025-01", "not-a-date"]) {
    assert.throws(() => getIncomeStatement(period));
    assert.throws(() => getBalanceStatement(period));
    assert.throws(() => getCashflowStatement(period));
  }
});
