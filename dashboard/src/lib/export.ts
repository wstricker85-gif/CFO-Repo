import { getLanguage, translate, type Language } from "./i18n.ts";
export function csvContent(
  rows: (string | number | null)[][],
  language: Language = getLanguage(),
): string {
  const quote = (value: string | number | null) => {
    let text =
      typeof value === "number"
        ? language === "de"
          ? String(value).replace(".", ",")
          : String(value)
        : (value ?? "");
    // Spreadsheet applications may execute cells that begin with formula characters.
    if (typeof value === "string" && /^[\s]*[=+\-@]/.test(text)) text = "'" + text;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return "\uFEFF" + rows.map((row) => row.map(quote).join(";")).join("\r\n");
}
export function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  downloadText(
    filename,
    csvContent(
      rows.map((row) => row.map((value) => (typeof value === "string" ? translate(value) : value))),
    ),
    "text/csv;charset=utf-8",
  );
}
