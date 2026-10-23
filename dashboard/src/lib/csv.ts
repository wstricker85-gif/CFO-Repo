import { round } from "./finance.ts";
export type ImportedMonth = {
  month: string;
  revenue: number;
  material: number;
  personnel: number;
  other: number;
  ebitda: number;
  depreciation: number | null;
  interest: number | null;
  taxes: number | null;
  planRevenue: number | null;
  planEbitda: number | null;
  cash: number | null;
  receivables: number | null;
  inventory: number | null;
  payables: number | null;
  equity: number | null;
  assets: number | null;
  ebit: number | null;
  netIncome: number | null;
};
export type ImportResult = { rows: ImportedMonth[]; errors: string[] };
/** Small deterministic CSV reader supporting quoted separators, escaped quotes and CRLF. */
export function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false,
    closed = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += c;
      continue;
    }
    if (closed && ![delimiter, "\n", "\r", " ", "\t"].includes(c))
      throw new Error("Unerwartetes Zeichen nach einem Anführungszeichen.");
    if (c === '"') {
      if (field.trim() || closed)
        throw new Error("Anführungszeichen innerhalb eines ungeschützten Feldes.");
      quoted = true;
      field = "";
    } else if (c === delimiter) {
      row.push(field);
      field = "";
      closed = false;
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      field = "";
      closed = false;
    } else if (!closed) field += c;
  }
  if (quoted) throw new Error("Nicht geschlossenes Anführungszeichen.");
  row.push(field);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}
export function parseMoney(input: string, locale: "de" | "en"): number | null {
  const text = input.trim().replace(/\u00a0/g, " ");
  const pattern =
    locale === "de"
      ? /^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/
      : /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/;
  if (!pattern.test(text)) return null;
  const value = Number(
    locale === "de" ? text.replaceAll(".", "").replace(",", ".") : text.replaceAll(",", ""),
  );
  return Number.isFinite(value) && Math.abs(value) <= 1e12 ? value : null;
}
export const csvColumns = [
  {
    key: "month",
    label: "Monat",
    aliases: ["monat", "month"],
    required: true,
    description: "JJJJ-MM; eine Zeile pro Monat, ein Kalenderjahr.",
  },
  {
    key: "revenue",
    label: "Umsatz",
    aliases: ["umsatz", "revenue"],
    required: true,
    description: "Monatliche Umsatzerlöse.",
  },
  {
    key: "material",
    label: "Material",
    aliases: ["material", "cogs"],
    required: true,
    description: "Material und Fremdleistungen im Monat.",
  },
  {
    key: "personnel",
    label: "Personal",
    aliases: ["personal", "personnel"],
    required: true,
    description: "Personalaufwand im Monat.",
  },
  {
    key: "other",
    label: "Sonstiges",
    aliases: ["sonstiges", "other"],
    required: true,
    description: "Sonstiger operativer Aufwand, ohne Abschreibungen, Zinsen und Steuern.",
  },
  {
    key: "depreciation",
    label: "Abschreibungen",
    aliases: ["abschreibungen", "depreciation"],
    required: false,
    description: "Monatsaufwand; ermöglicht EBIT.",
  },
  {
    key: "interest",
    label: "Zinsen",
    aliases: ["zinsen", "interest"],
    required: false,
    description: "Monatlicher Nettozinsaufwand; Zinsertrag negativ.",
  },
  {
    key: "taxes",
    label: "Ertragsteuern",
    aliases: ["ertragsteuern", "taxes"],
    required: false,
    description: "Steueraufwand im Monat; Steuerertrag negativ.",
  },
  {
    key: "planRevenue",
    label: "Planumsatz",
    aliases: ["planumsatz", "plan_revenue"],
    required: false,
    description: "Umsatzplan des Monats.",
  },
  {
    key: "planEbitda",
    label: "PlanEBITDA",
    aliases: ["planebitda", "plan_ebitda"],
    required: false,
    description: "EBITDA-Plan des Monats; Verlust negativ.",
  },
  {
    key: "cash",
    label: "LiquideMittel",
    aliases: ["liquidemittel", "cash"],
    required: false,
    description: "Liquide Mittel am Monatsende.",
  },
  {
    key: "receivables",
    label: "Forderungen",
    aliases: ["forderungen", "receivables"],
    required: false,
    description: "Forderungen aus Lieferungen und Leistungen am Monatsende.",
  },
  {
    key: "inventory",
    label: "Vorraete",
    aliases: ["vorraete", "vorräte", "inventory"],
    required: false,
    description: "Vorräte am Monatsende.",
  },
  {
    key: "payables",
    label: "Lieferverbindlichkeiten",
    aliases: ["lieferverbindlichkeiten", "payables"],
    required: false,
    description: "Verbindlichkeiten aus Lieferungen und Leistungen am Monatsende.",
  },
  {
    key: "equity",
    label: "Eigenkapital",
    aliases: ["eigenkapital", "equity"],
    required: false,
    description: "Eigenkapital am Monatsende; negatives Eigenkapital ist zulässig.",
  },
  {
    key: "assets",
    label: "Bilanzsumme",
    aliases: ["bilanzsumme", "assets"],
    required: false,
    description: "Summe der Aktiva am Monatsende.",
  },
] as const;
const signedFields = new Set(["interest", "taxes", "planEbitda", "equity"]);
export const csvTemplate =
  csvColumns.map((c) => c.label).join(";") +
  "\r\n" +
  [
    [
      "2026-01",
      960000,
      520000,
      210000,
      110000,
      18000,
      10000,
      27600,
      1000000,
      130000,
      600000,
      1300000,
      850000,
      650000,
      1700000,
      4800000,
    ],
    [
      "2026-02",
      1020000,
      550000,
      215000,
      115000,
      18000,
      10000,
      33600,
      1020000,
      140000,
      650000,
      1350000,
      860000,
      670000,
      1778400,
      4900000,
    ],
    [
      "2026-03",
      1080000,
      580000,
      220000,
      120000,
      19000,
      10000,
      39300,
      1050000,
      150000,
      680000,
      1400000,
      870000,
      690000,
      1870100,
      5000000,
    ],
    [
      "2026-04",
      1040000,
      560000,
      220000,
      122000,
      19000,
      10000,
      32700,
      1080000,
      155000,
      660000,
      1450000,
      880000,
      700000,
      1946400,
      5100000,
    ],
    [
      "2026-05",
      1150000,
      620000,
      225000,
      125000,
      20000,
      10000,
      45000,
      1100000,
      165000,
      730000,
      1500000,
      890000,
      710000,
      2051400,
      5200000,
    ],
    [
      "2026-06",
      1120000,
      600000,
      230000,
      127000,
      20000,
      10000,
      39900,
      1120000,
      170000,
      710000,
      1550000,
      900000,
      720000,
      2144500,
      5300000,
    ],
    [
      "2026-07",
      1210000,
      650000,
      235000,
      130000,
      21000,
      10000,
      49200,
      1150000,
      180000,
      790000,
      1600000,
      910000,
      730000,
      2259300,
      5500000,
    ],
    [
      "2026-08",
      1190000,
      642600,
      235000,
      131520,
      22000,
      11000,
      44364,
      1180000,
      180000,
      768000,
      1700000,
      920000,
      740000,
      2362816,
      5700000,
    ],
    [
      "2026-09",
      1280000,
      692000,
      240000,
      138000,
      24000,
      11000,
      52500,
      1200000,
      180000,
      842000,
      1800000,
      930000,
      750000,
      2485316,
      5900000,
    ],
    [
      "2026-10",
      1310000,
      705000,
      242000,
      140000,
      24000,
      11000,
      56400,
      1250000,
      190000,
      880000,
      1900000,
      940000,
      760000,
      2616916,
      6100000,
    ],
    [
      "2026-11",
      1340000,
      720000,
      244000,
      142000,
      25000,
      11000,
      59400,
      1300000,
      200000,
      910000,
      2000000,
      950000,
      770000,
      2755516,
      6300000,
    ],
    [
      "2026-12",
      1390000,
      745000,
      248000,
      146000,
      25000,
      11000,
      64500,
      1350000,
      210000,
      980000,
      2100000,
      960000,
      780000,
      2906016,
      6500000,
    ],
  ]
    .map((row) => row.join(";"))
    .join("\r\n") +
  "\r\n";
export function validatePnlCsv(text: string, delimiter: string, locale: "de" | "en"): ImportResult {
  const errors: string[] = [];
  let csv: string[][];
  try {
    csv = parseCsv(text, delimiter);
  } catch (error) {
    return {
      rows: [],
      errors: [error instanceof Error ? error.message : "CSV konnte nicht gelesen werden."],
    };
  }
  if (csv.length < 2)
    return {
      rows: [],
      errors: ["Eine Kopfzeile und mindestens eine Datenzeile sind erforderlich."],
    };
  if (csv.length > 1001)
    return { rows: [], errors: ["Die Vorschau unterstützt höchstens 1.000 Datenzeilen."] };
  const header = csv[0].map((v) => v.trim().toLocaleLowerCase("de"));
  const mapping: Record<string, number> = {};
  for (const column of csvColumns) {
    const matches = header
      .map((v, i) => ((column.aliases as readonly string[]).includes(v) ? i : -1))
      .filter((i) => i >= 0);
    if (matches.length > 1 || (column.required && !matches.length))
      errors.push(`Spalte ${column.label} fehlt oder ist mehrfach vorhanden.`);
    else if (matches.length === 1) mapping[column.key] = matches[0];
  }
  if (errors.length) return { rows: [], errors };
  const rows: ImportedMonth[] = [];
  const seen = new Set<string>();
  csv.slice(1).forEach((line, index) => {
    const at = `Zeile ${index + 2}`;
    if (line.length !== header.length) {
      errors.push(`${at}: Spaltenanzahl stimmt nicht mit der Kopfzeile überein.`);
      return;
    }
    const month = line[mapping.month].trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      errors.push(`${at}: Monat muss im Format JJJJ-MM vorliegen.`);
      return;
    }
    if (seen.has(month)) {
      errors.push(`${at}: Monat ${month} ist doppelt vorhanden.`);
      return;
    }
    seen.add(month);
    const amounts = ["revenue", "material", "personnel", "other"].map((key) =>
      parseMoney(line[mapping[key]], locale),
    );
    if (amounts.some((v) => v === null || v < 0)) {
      errors.push(
        `${at}: Umsatz und Kosten müssen nicht negative Beträge im gewählten Zahlenformat sein.`,
      );
      return;
    }
    const [revenue, material, personnel, other] = amounts as number[];
    const optional = {} as Record<
      Exclude<
        (typeof csvColumns)[number]["key"],
        "month" | "revenue" | "material" | "personnel" | "other"
      >,
      number | null
    >;
    for (const column of csvColumns.filter((c) => !c.required)) {
      const raw = mapping[column.key] === undefined ? "" : line[mapping[column.key]].trim();
      const value = raw === "" ? null : parseMoney(raw, locale);
      if (raw !== "" && (value === null || (!signedFields.has(column.key) && value < 0)))
        errors.push(
          `${at}: Ungültiger Betrag in ${column.label}. Leer = nicht verfügbar; Vorzeichen und Zahlenformat prüfen.`,
        );
      optional[column.key as keyof typeof optional] = value;
    }
    if (optional.assets !== null) {
      const knownAssets = [optional.cash, optional.receivables, optional.inventory].reduce<number>(
        (total, v) => total + (v ?? 0),
        0,
      );
      if (knownAssets > optional.assets + 0.01)
        errors.push(`${at}: Liquide Mittel, Forderungen und Vorräte übersteigen die Bilanzsumme.`);
      if (optional.equity !== null && optional.equity > optional.assets + 0.01)
        errors.push(`${at}: Eigenkapital übersteigt die Bilanzsumme.`);
      if (
        optional.payables !== null &&
        optional.equity !== null &&
        optional.payables > optional.assets - optional.equity + 0.01
      )
        errors.push(
          `${at}: Lieferverbindlichkeiten übersteigen die aus Bilanzsumme und Eigenkapital abgeleiteten Schulden.`,
        );
    }
    const ebitda = round(revenue - material - personnel - other);
    const ebit = optional.depreciation === null ? null : round(ebitda - optional.depreciation);
    const netIncome =
      ebit === null || optional.interest === null || optional.taxes === null
        ? null
        : round(ebit - optional.interest - optional.taxes);
    rows.push({
      ...optional,
      ebit,
      netIncome,
      month,
      revenue,
      material,
      personnel,
      other,
      ebitda,
    });
  });
  if (new Set(rows.map((r) => r.month.slice(0, 4))).size > 1)
    errors.push("Bitte nur ein Geschäftsjahr pro Datei verwenden.");
  // Fail closed: never expose a seemingly complete aggregate of partially valid data.
  return errors.length
    ? { rows: [], errors }
    : { rows: rows.sort((a, b) => a.month.localeCompare(b.month)), errors: [] };
}

export function getCsvTemplate(language: "de" | "en" = "de") {
  return language === "de"
    ? csvTemplate
    : csvColumns.map((c) => c.aliases[1]).join(";") +
        csvTemplate.slice(csvTemplate.indexOf("\r\n"));
}
