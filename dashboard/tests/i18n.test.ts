import test from "node:test";
import assert from "node:assert/strict";
import { translate, setLanguage, getLanguage, subscribeLanguage } from "../src/lib/i18n.ts";
import { getCsvTemplate, validatePnlCsv } from "../src/lib/csv.ts";
import { csvContent } from "../src/lib/export.ts";
import { tourSteps } from "../src/lib/tour.ts";
import { formatValue, formatCompactCurrency, formatDate } from "../src/lib/format.ts";
import { buildReport } from "../src/lib/report.ts";
import { demoSnapshots } from "../src/lib/demo-data.ts";

test("English translates all tour content and retains dynamic values and inline spacing", () => {
  for (const step of tourSteps)
    for (const key of ["chapter", "title", "description", "benefit", "tryIt", "dataNote"] as const)
      assert.notEqual(translate(step[key], "en"), step[key], `${step.path}: ${key}`);
  assert.equal(translate(" Umsatz ", "en"), " Revenue ");
  assert.equal(translate("Station 7 von 15", "en"), "Stop 7 of 15");
  assert.equal(translate("Umsatz", "de"), "Umsatz");
  assert.equal(translate(null, "en"), null);
  assert.equal(translate("constructor", "en"), "constructor");
});
test("English CSV template preserves the validated ledger and machine-readable schema", () => {
  const de = validatePnlCsv(getCsvTemplate("de"), ";", "de");
  const en = validatePnlCsv(getCsvTemplate("en"), ";", "en");
  assert.deepEqual(en.errors, []);
  assert.deepEqual(en.rows, de.rows);
  assert.equal(en.rows.length, 12);
  assert.match(getCsvTemplate("en"), /^month;revenue;cogs;personnel;other;/);
  assert.match(csvContent([["Value"], [1234.5]], "en"), /1234\.5/);
  assert.match(csvContent([["Value"], [1234.5]], "de"), /1234,5/);
  assert.match(csvContent([["=unsafe"]], "en"), /'=unsafe/);
});
test("Language preference updates formatting and reports while preserving own notes", () => {
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  let notifications = 0;
  const unsubscribe = subscribeLanguage(() => notifications++);
  try {
    setLanguage("en");
    assert.equal(getLanguage(), "en");
    assert.equal(formatValue(1234.5, "currency"), "€1,235");
    assert.equal(formatValue(46, "days"), "46 days");
    assert.equal(formatCompactCurrency(1280000), "€1.28m");
    assert.equal(formatDate("2026-09-30"), "30/09/2026");
    const notes = "Umsatz und Bilanz: eigene Anmerkung.";
    const report = buildReport(demoSnapshots[0], {
      notes,
      full: true,
      includeCash: true,
      includeRisks: true,
    });
    assert.ok(report.markdown.includes(notes));
    assert.ok(report.markdown.includes("Revenue in September 2026 is €1.28m"));
    const generated = report.markdown.replace(notes, "");
    assert.doesNotMatch(generated, /[äöüß]|\b(und|nicht|Forderungen|Monatsumsatz)\b/);
    setLanguage("de");
    assert.equal(formatValue(46, "days"), "46 Tage");
    assert.equal(notifications, 2);
  } finally {
    unsubscribe();
    setLanguage("de");
    Reflect.deleteProperty(globalThis, "window");
  }
});
