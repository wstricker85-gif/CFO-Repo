"use client";
import { useTranslation } from "@/components/i18n/Language";
import type { StatementLine } from "@/lib/statements";
import { formatDelta, formatStatementAmount, formatValue } from "@/lib/format";
import { variance } from "@/lib/finance";
import { MetricInfo } from "@/components/ui/MetricInfo";

type Row = StatementLine & { previous?: number };
export function StatementTable({
  rows,
  periodLabel,
  comparisonLabel,
  comparisonKey,
  total,
  scale = "eur",
  income = false,
}: {
  rows: Row[];
  periodLabel: string;
  comparisonLabel?: string;
  comparisonKey?: "previous" | "budget";
  total?: number;
  scale?: "eur" | "thousand";
  income?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label={t(`Abschlussdarstellung ${periodLabel}, horizontal scrollbar`)}
    >
      <table
        className={`data-table statement-table ${comparisonKey ? "" : "statement-table-compact"}`}
      >
        <caption className="sr-only">
          {t(" Fiktiver Abschluss: ")}
          {t(periodLabel)}
          {t(". Beträge in ")}
          {t(scale === "eur" ? "Euro" : "Tausend Euro")}.{t(" ")}
          {t(income ? "Aufwendungen sind negativ dargestellt." : "")}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t("Position")}</th>
            <th scope="col" className="number-cell">
              {t(comparisonKey === "budget" ? "Ist" : "Betrag")}
            </th>
            {comparisonKey && (
              <>
                <th scope="col" className="number-cell">
                  {t(comparisonLabel)}
                </th>
                <th scope="col" className="number-cell">
                  Δ {t(scale === "eur" ? "EUR" : "Tsd. €")}
                </th>
              </>
            )}
            {total !== undefined && (
              <th scope="col" className="number-cell">
                {t(" Anteil ")}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const reference = comparisonKey ? row[comparisonKey] : undefined;
            const delta = reference === undefined ? null : variance(row.value, reference);
            const analysis =
              reference === undefined
                ? `Betrag in dieser Ansicht: ${formatValue(row.value, "currency")}.`
                : `Aktuell ${formatValue(row.value, "currency")}; ${comparisonLabel}: ${formatValue(reference, "currency")}. Veränderung: ${formatDelta(row.value - reference, "currency")}.`;
            return (
              <tr key={row.id} className={`statement-row-${row.kind}`}>
                <th scope="row">
                  <span
                    className="statement-line-label"
                    style={{ paddingLeft: row.depth ? 10 : 0 }}
                  >
                    <span>{t(row.label)}</span>
                    <MetricInfo
                      insight={{
                        title: row.label,
                        definition: row.description,
                        analysis,
                        sourceLabel: `${periodLabel} · Beispieldaten`,
                      }}
                    />
                  </span>
                </th>
                <td className="number-cell">{t(formatStatementAmount(row.value, scale))}</td>
                {comparisonKey && (
                  <>
                    <td className="number-cell muted">
                      {t(reference === undefined ? "—" : formatStatementAmount(reference, scale))}
                    </td>
                    <td
                      className="number-cell"
                      data-assessment={income && delta ? delta.assessment : "unknown"}
                    >
                      {t(
                        delta
                          ? `${delta.absolute > 0 ? "+" : delta.absolute < 0 ? "−" : ""}${formatStatementAmount(Math.abs(delta.absolute), scale)}`
                          : "—",
                      )}
                    </td>
                  </>
                )}
                {total !== undefined && (
                  <td className="number-cell muted">
                    {t(total === 0 ? "—" : formatValue((row.value / total) * 100, "percent"))}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
