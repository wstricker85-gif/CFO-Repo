import test from "node:test";
import assert from "node:assert/strict";
import { csvTemplate, validatePnlCsv } from "../src/lib/csv.ts";
import { analyzeCsv } from "../src/lib/csv-analysis.ts";
const base = "Monat;Umsatz;Material;Personal;Sonstiges";
function read(text: string) {
  const r = validatePnlCsv(text, ";", "de");
  assert.deepEqual(r.errors, []);
  return r.rows;
}
function stat(a: ReturnType<typeof analyzeCsv>, label: string) {
  return [...a.sections.flatMap((s) => s.stats), ...a.comparisons].find((s) => s.label === label)!;
}
test("twelve-month sample validates and distinguishes summed flows from closing stocks", () => {
  const rows = read(csvTemplate),
    a = analyzeCsv(rows);
  assert.equal(rows.length, 12);
  assert.equal(stat(a, "Umsatz").value, 14090000);
  assert.equal(stat(a, "EBITDA").value, 2194880);
  assert.equal(stat(a, "EBIT").value, 1939880);
  assert.equal(stat(a, "Ergebnis nach Steuern").value, 1270416);
  assert.equal(stat(a, "Liquide Mittel").value, 980000);
  assert.equal(stat(a, "Eigenkapital").value, 2906016);
  assert.equal(stat(a, "Net Working Capital").value, 2280000);
  assert.equal(stat(a, "Umsatz gegen Plan").value, 290000);
  assert.equal(stat(a, "EBITDA gegen Plan").value, 144880);
  assert.equal(
    a.commentary.some((p) => p.includes("Forderungen")),
    true,
  );
});
test("single-month selection changes flow and stock basis without mutating source", () => {
  const rows = read(csvTemplate),
    copy = structuredClone(rows),
    a = analyzeCsv(rows, "2026-09");
  assert.equal(a.count, 1);
  assert.equal(stat(a, "Umsatz").value, 1280000);
  assert.equal(stat(a, "Ergebnis nach Steuern").value, 122500);
  assert.equal(stat(a, "Liquide Mittel").value, 842000);
  assert.equal(a.latestMonth, "2026-09");
  assert.equal(stat(a, "Umsatz zum Vormonat").value, 7.6);
  assert.equal(stat(a, "EBITDA zum Vormonat").value, 29120);
  assert.deepEqual(rows, copy);
});
test("legacy five-column files remain supported without invented optional zeroes", () => {
  const rows = read(base + "\n2026-09;1000;500;200;100");
  const a = analyzeCsv(rows);
  assert.equal(stat(a, "EBITDA").value, 200);
  assert.equal(stat(a, "EBIT").value, null);
  assert.equal(stat(a, "Liquide Mittel").value, null);
  assert.equal(stat(a, "Eigenkapitalquote").value, null);
  assert.equal(stat(a, "Umsatz gegen Plan").value, null);
  assert.equal(rows[0].depreciation, null);
  assert.equal(
    a.commentary.some((p) => p.includes("nicht verfügbar")),
    true,
  );
});
test("blank and absent optional fields differ from a reported zero; totals fail closed for partial coverage", () => {
  const rows = read(
    base +
      ";Abschreibungen;Zinsen;Ertragsteuern;LiquideMittel;Planumsatz\n2026-08;100;20;10;10;0;0;0;0;100\n2026-09;200;40;20;20;;0;0;;",
  );
  assert.equal(rows[0].ebit, 60);
  assert.equal(rows[0].cash, 0);
  assert.equal(rows[1].ebit, null);
  const a = analyzeCsv(rows);
  assert.equal(stat(a, "EBIT").value, null);
  assert.equal(stat(a, "Umsatz gegen Plan").value, null);
  assert.equal(stat(a, "Liquide Mittel").value, null);
  assert.equal(stat(analyzeCsv(rows, "2026-08"), "Liquide Mittel").value, 0);
});
test("margins are weighted and zero denominators or gaps do not create comparisons", () => {
  const rows = read(base + "\n2026-01;100;20;10;20\n2026-03;900;600;100;150");
  const a = analyzeCsv(rows);
  assert.equal(stat(a, "EBITDA-Marge").value, 10);
  assert.equal(stat(a, "Umsatz zum Vormonat").value, null);
  assert.equal(stat(a, "EBITDA zum Vormonat").value, null);
  const zero = analyzeCsv(read(base + "\n2026-01;0;0;0;0\n2026-02;100;0;0;0"));
  assert.equal(stat(zero, "Umsatz zum Vormonat").value, null);
  assert.equal(stat(analyzeCsv(read(base + "\n2026-01;0;10;0;0")), "EBITDA-Marge").value, null);
});
test("optional English aliases, signed equity, interest income and tax benefits are accepted", () => {
  const rows = read(
    base +
      ";depreciation;interest;taxes;equity;assets;plan_ebitda\n2026-01;100;80;20;10;0;-5;-2;-30;100;-20",
  );
  assert.equal(rows[0].ebit, -10);
  assert.equal(rows[0].netIncome, -3);
  assert.equal(stat(analyzeCsv(rows), "Eigenkapitalquote").value, -30);
});
test("malformed optional numbers, duplicate aliases and impossible supplied balance totals reject entire import", () => {
  for (const extra of [
    ";LiquideMittel\n2026-01;100;20;10;10;kaputt",
    ";LiquideMittel\n2026-01;100;20;10;10;-1",
    ";LiquideMittel;cash\n2026-01;100;20;10;10;10;10",
    ";LiquideMittel;Forderungen;Bilanzsumme\n2026-01;100;20;10;10;50;60;100",
    ";Eigenkapital;Bilanzsumme\n2026-01;100;20;10;10;110;100",
    ";Eigenkapital;Bilanzsumme;Lieferverbindlichkeiten\n2026-01;100;20;10;10;90;100;20",
  ]) {
    const r = validatePnlCsv(base + extra, ";", "de");
    assert.ok(r.errors.length);
    assert.equal(r.rows.length, 0);
  }
});
test("analysis rejects empty or unsupported selected periods", () => {
  assert.throws(() => analyzeCsv([]));
  assert.throws(() => analyzeCsv(read(csvTemplate), "2025-12"));
});
