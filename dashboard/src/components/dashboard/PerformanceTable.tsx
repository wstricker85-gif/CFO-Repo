"use client";
import { useTranslation } from "@/components/i18n/Language";
import type { PerformanceRow } from "@/lib/demo-data";
import { assessmentLabels, formatDelta, formatValue } from "@/lib/format";

export function PerformanceTable({ rows, period }: { rows: PerformanceRow[]; period: string }) {
  const { t } = useTranslation();

  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label={t("Ergebnistabelle, horizontal scrollbar")}
    >
      <table className="performance-table tabular">
        <caption className="sr-only">
          {t(" Ergebnisrechnung ")}
          {t(period)}
          {t(", fiktive Demodaten in Euro. Abweichung ist Ist minus Plan. ")}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t("Position")}</th>
            <th scope="col">{t("Ist")}</th>
            <th scope="col">{t("Plan")}</th>
            <th scope="col">{t("Abweichung €")}</th>
            <th scope="col">{t("Abweichung %")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className={row.emphasis ? "emphasis-row" : ""}>
              <th scope="row">{t(row.label)}</th>
              <td>{t(formatValue(row.actual, "currency"))}</td>
              <td className="muted">{t(formatValue(row.budget, "currency"))}</td>
              <td data-assessment={row.assessment}>
                {t(formatDelta(row.variance, "currency"))}
                <span className="sr-only">, {t(assessmentLabels[row.assessment])}</span>
              </td>
              <td data-assessment={row.assessment}>
                {t(
                  row.variancePercent === null ? "—" : formatDelta(row.variancePercent, "percent"),
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
