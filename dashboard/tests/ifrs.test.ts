import test from "node:test";
import assert from "node:assert/strict";
import { getIfrsBridge, ifrsOptionsSchema, type IfrsOptions } from "../src/lib/ifrs.ts";
import { getBalanceStatement, getIncomeStatement } from "../src/lib/statements.ts";
import { round } from "../src/lib/finance.ts";
const variants: IfrsOptions[] = [
  { lease: false, development: false },
  { lease: true, development: false },
  { lease: false, development: true },
  { lease: true, development: true },
];
test("every switch combination and period preserves the IFRS balance equation and equity/profit tie", () => {
  for (const period of ["2026-08", "2026-09"]) {
    for (const options of variants) {
      for (const ytd of [true, false]) {
        const r = getIfrsBridge(period, options, ytd),
          yearly = getIfrsBridge(period, options, true);
        assert.equal(r.difference, 0);
        assert.equal(r.equity.delta, yearly.net.delta);
        assert.equal(r.cashChange, 0);
        for (const row of [...r.balanceRows, ...r.incomeRows])
          assert.equal(row.ifrs, round(row.hgb + row.lease + row.development + row.tax));
        const values = (ids: string[]) =>
          round(
            r.balanceRows
              .filter((row) => ids.includes(row.id))
              .reduce((sum, row) => sum + row.ifrs, 0),
          );
        assert.equal(values(["intangibles", "rou", "dta", "other-assets"]), r.assets.ifrs);
        assert.equal(
          values(["equity", "lease", "dtl", "other-liabilities"]),
          r.balanceRows.find((row) => row.id === "liabilities")!.ifrs,
        );
        for (const entry of r.journal) {
          assert.ok(entry.amount > 0 && Number.isFinite(entry.amount));
          assert.notEqual(entry.debit, entry.credit);
        }
      }
    }
  }
});
test("all cases off reproduces original HGB ledger and income, with no residual tax entries", () => {
  for (const period of ["2026-08", "2026-09"]) {
    const r = getIfrsBridge(period, { lease: false, development: false });
    assert.deepEqual(r.journal, []);
    for (const row of [...r.balanceRows, ...r.incomeRows]) {
      assert.equal(row.delta, 0);
      assert.equal(row.ifrs, row.hgb);
    }
    assert.equal(r.net.ifrs, getIncomeStatement(period, true).netIncome);
    assert.equal(r.assets.ifrs, round(getBalanceStatement(period).totals.assets));
  }
});
test("September reference lease uses discounted unpaid payments, interest and linear depreciation", () => {
  const r = getIfrsBridge("2026-09", { lease: true, development: false });
  assert.equal(r.initialLease, 620706.73);
  assert.equal(r.monthlyDepreciation, 10345.11);
  assert.equal(r.closing.lease, 539018.35);
  assert.equal(r.closing.rou, 527600.74);
  assert.equal(r.ebitda.delta, 108000);
  assert.equal(r.equity.lease, -11417.61);
  assert.equal(r.closing.development, 0);
  assert.equal(r.equity.development, 0);
  const opening = r.journal.filter((e) => e.month === 0);
  assert.equal(opening.length, 3);
  assert.equal(opening.find((e) => e.debit === "dta")!.amount, 186212.02);
  assert.equal(opening.find((e) => e.credit === "dtl")!.amount, 186212.02);
});
test("qualifying development is activated from January, unamortized until available for use", () => {
  const r = getIfrsBridge("2026-09", { lease: false, development: true });
  assert.equal(r.closing.development, 162000);
  assert.equal(r.closing.dtl, 48600);
  assert.equal(r.closing.dta, 0);
  assert.equal(r.ebitda.delta, 162000);
  assert.equal(r.net.delta, 113400);
  assert.equal(
    r.journal.some((e) => e.group === "lease"),
    false,
  );
  const month = getIfrsBridge("2026-09", { lease: false, development: true }, false);
  assert.equal(month.net.delta, 12600);
});
test("September monthly adjustments equal the change in cumulative balances, including deferred tax", () => {
  for (const options of variants) {
    const aug = getIfrsBridge("2026-08", options),
      sep = getIfrsBridge("2026-09", options),
      month = getIfrsBridge("2026-09", options, false);
    for (const row of month.incomeRows) {
      const a = aug.incomeRows.find((r) => r.id === row.id)!,
        s = sep.incomeRows.find((r) => r.id === row.id)!;
      assert.equal(round(s.delta - a.delta), row.delta);
    }
    assert.equal(round(sep.equity.delta - aug.equity.delta), month.net.delta);
  }
});
test("gross deferred tax balances follow temporary differences and net expense reconciles", () => {
  const r = getIfrsBridge("2026-09");
  assert.equal(r.closing.dta, round(r.closing.lease * 0.3));
  assert.equal(
    r.closing.dtl,
    round(round(r.closing.rou * 0.3) + round(r.closing.development * 0.3)),
  );
  assert.equal(r.net.tax, round(r.closing.dta - r.closing.dtl));
  assert.equal(r.equity.ifrs, 2588323.67);
  assert.equal(r.net.ifrs, 938323.67);
  const month = getIfrsBridge("2026-09", undefined, false);
  assert.equal(month.net.ifrs, 134339.45);
});
test("bridge stages connect exactly and selected cases never mutate the historical ledger", () => {
  const before = structuredClone(getBalanceStatement("2026-09"));
  for (const options of variants) {
    const r = getIfrsBridge("2026-09", options);
    assert.equal(r.stages[0].to, r.equity.hgb);
    for (let i = 1; i < r.stages.length - 1; i++) {
      assert.equal(r.stages[i].from, r.stages[i - 1].to);
      assert.equal(r.stages[i].to, round(r.stages[i].from + r.stages[i].value));
    }
    assert.equal(r.stages.at(-2)!.to, r.equity.ifrs);
    assert.equal(r.stages.at(-1)!.value, r.equity.ifrs);
  }
  assert.deepEqual(getBalanceStatement("2026-09"), before);
});
test("unsupported periods and malformed case selections fail visibly", () => {
  assert.throws(() => getIfrsBridge("2026-07"));
  assert.throws(() => getIfrsBridge("invalid"));
  assert.equal(ifrsOptionsSchema.safeParse({ lease: "yes", development: true }).success, false);
  assert.equal(
    ifrsOptionsSchema.safeParse({ lease: true, development: true, tax: false }).success,
    false,
  );
});
