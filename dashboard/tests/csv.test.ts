import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv, parseMoney, validatePnlCsv } from "../src/lib/csv.ts";

const header = "Monat;Umsatz;Material;Personal;Sonstiges\n";
test("CSV reads BOM, quoted separators, escaped quotes and embedded newline", () => {
  assert.deepEqual(parseCsv('\uFEFFa;b\r\n"Kunde; A";"Text ""B"""\r\n"mehr\nzeilig";2', ";"), [
    ["a", "b"],
    ["Kunde; A", 'Text "B"'],
    ["mehr\nzeilig", "2"],
  ]);
  assert.throws(() => parseCsv('a;"nicht geschlossen', ";"));
  assert.throws(() => parseCsv('a;"Text"def', ";"));
});
test("numbers follow chosen locale and reject ambiguous/malformed values", () => {
  assert.equal(parseMoney("1.234,56", "de"), 1234.56);
  assert.equal(parseMoney("1,234.56", "en"), 1234.56);
  assert.equal(parseMoney("0", "de"), 0);
  assert.equal(parseMoney("", "de"), null);
  for (const value of ["1.23,45", "1,23.45", "1e6", "NaN", "Infinity", "=1+1", "100 €", "12,3456"])
    assert.equal(parseMoney(value, "de"), null, value);
});
test("valid German P&L produces a reconciled preview", () => {
  const result = validatePnlCsv(header + "2026-09;1.280.000;692.000;240.000;138.000", ";", "de");
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows[0].ebitda, 210000);
});
test("English aliases, comma delimiters and quoted amounts work", () => {
  const result = validatePnlCsv(
    'month,revenue,cogs,personnel,other\n2026-09,"1,280,000","692,000","240,000","138,000"',
    ",",
    "en",
  );
  assert.equal(result.errors.length, 0);
  assert.equal(result.rows[0].ebitda, 210000);
});
test("reject duplicate months/headers, invalid dates and partial success", () => {
  assert.equal(
    validatePnlCsv(header + "2026-09;1000;500;200;100\n2026-09;1000;500;200;100", ";", "de").rows
      .length,
    0,
  );
  assert.ok(
    validatePnlCsv(
      "Monat;Umsatz;Material;Personal;Sonstiges;revenue\n2026-09;1000;500;200;100;1",
      ";",
      "de",
    ).errors.length,
  );
  assert.ok(validatePnlCsv(header + "2026-13;1000;500;200;100", ";", "de").errors.length);
  const partial = validatePnlCsv(
    header + "2026-08;1000;500;200;100\n2026-09;kaputt;500;200;100",
    ";",
    "de",
  );
  assert.equal(partial.rows.length, 0);
  assert.equal(partial.errors.length, 1);
});
test("zero revenue stays zero, loss is allowed, negative imported costs rejected", () => {
  const result = validatePnlCsv(header + "2026-09;0;500;200;100", ";", "de");
  assert.equal(result.rows[0].revenue, 0);
  assert.equal(result.rows[0].ebitda, -800);
  assert.ok(validatePnlCsv(header + "2026-09;1000;-500;200;100", ";", "de").errors.length);
});
test("cross-year and inconsistent column counts are rejected", () => {
  assert.ok(
    validatePnlCsv(header + "2025-12;1000;500;200;100\n2026-01;1000;500;200;100", ";", "de").errors
      .length,
  );
  assert.ok(validatePnlCsv(header + "2026-09;1000;500;200;100;extra", ";", "de").errors.length);
});

test("TSV preview uses real tab delimiters", () => {
  const result = validatePnlCsv(
    "month\trevenue\tcogs\tpersonnel\tother\n2026-09\t1000\t500\t200\t100",
    "\t",
    "en",
  );
  assert.equal(result.errors.length, 0);
  assert.equal(result.rows[0].ebitda, 200);
});
