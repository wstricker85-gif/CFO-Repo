"use client";
import { getLocale } from "@/lib/i18n";
import { useTranslation } from "@/components/i18n/Language";
import { useId } from "react";
import { formatCompactCurrency } from "@/lib/format";

type Point = { month: string; revenue: number; budget: number; ebitda: number };
export function RevenueChart({
  points,
  series,
}: {
  points: Point[];
  series: "revenue" | "ebitda";
}) {
  const { t } = useTranslation();

  const titleId = useId();
  const descriptionId = useId();
  const width = 720,
    height = 248,
    left = 48,
    right = 12,
    top = 16,
    bottom = 34;
  const plotHeight = height - top - bottom;
  const max = series === "revenue" ? 1500000 : 250000;
  const step = (width - left - right) / points.length;
  const y = (v: number) => top + plotHeight * (1 - v / max);
  return (
    <div className="chart-container">
      <svg
        className="revenue-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>
          {t(
            series === "revenue"
              ? "Monatlicher Umsatz im Vergleich zum Plan"
              : "Monatliches EBITDA",
          )}
        </title>
        <desc id={descriptionId}>
          {t(
            " Fiktive Demodaten in Tausend Euro. Die genauen Werte stehen in der aufklappbaren Datentabelle unter dem Diagramm. ",
          )}
        </desc>
        {[0, 1, 2, 3].map((i) => {
          const value = (max * i) / 3;
          return (
            <g key={i}>
              <line
                x1={left}
                x2={width - right}
                y1={y(value)}
                y2={y(value)}
                className="chart-gridline"
              />
              <text x={left - 12} y={y(value) + 4} textAnchor="end" className="chart-axis">
                {t(Math.round(value / 1000).toLocaleString(getLocale()))}
              </text>
            </g>
          );
        })}
        {points.map((point, i) => {
          const x = left + step * i + step / 2;
          const value = series === "revenue" ? point.revenue : point.ebitda;
          return (
            <g key={point.month}>
              <rect
                x={x - 13}
                y={y(value)}
                width={26}
                height={Math.max(0, y(0) - y(value))}
                className={series === "revenue" ? "chart-bar" : "chart-ebitda"}
              >
                <title>
                  {t(point.month)}: {t(formatCompactCurrency(value))}
                </title>
              </rect>
              {series === "revenue" && (
                <line
                  x1={x - 19}
                  x2={x + 19}
                  y1={y(point.budget)}
                  y2={y(point.budget)}
                  className="chart-plan"
                >
                  <title>
                    {t(" Plan ")}
                    {t(point.month)}: {t(formatCompactCurrency(point.budget))}
                  </title>
                </line>
              )}
              <text x={x} y={height - 9} textAnchor="middle" className="chart-axis">
                {t(point.month)}
              </text>
            </g>
          );
        })}
      </svg>
      <details className="chart-data">
        <summary>{t("Diagrammdaten anzeigen")}</summary>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">{t("Demowerte des Diagramms")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("Monat")}</th>
                <th scope="col">{t("Umsatz")}</th>
                <th scope="col">{t("Plan")}</th>
                <th scope="col">{t("EBITDA")}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.month}>
                  <th scope="row">{t(p.month)}</th>
                  <td>{t(formatCompactCurrency(p.revenue))}</td>
                  <td>{t(formatCompactCurrency(p.budget))}</td>
                  <td>{t(formatCompactCurrency(p.ebitda))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
