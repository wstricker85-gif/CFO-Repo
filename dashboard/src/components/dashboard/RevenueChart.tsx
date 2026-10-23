"use client";
import { useTranslation } from "@/components/i18n/Language";
import { useId, useState } from "react";
import { formatCompactCurrency, formatValue } from "@/lib/format";
import type { OverviewChartPoint } from "@/lib/overview-chart";

export function RevenueChart({
  points,
  marginTarget,
  cashTarget,
}: {
  points: OverviewChartPoint[];
  marginTarget: number;
  cashTarget: number;
}) {
  const { t, language, locale } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const active = points.find((p) => p.period === (preview ?? pinned)) ?? points.at(-1);
  if (!active) return null;

  const width = 960,
    left = 60,
    right = 60,
    top = 30,
    baseline = 204;
  const step = (width - left - right) / points.length;
  const revenueMax =
    Math.ceil(Math.max(...points.flatMap((p) => [p.revenue, p.budget]), 1) / 500000) * 500000;
  const marginMin = Math.min(0, ...points.map((p) => p.margin ?? 0));
  const marginMax = Math.max(20, marginTarget, ...points.map((p) => p.margin ?? 0));
  const cashMax =
    Math.ceil(Math.max(...points.map((p) => p.cash), cashTarget, 1) / 250000) * 250000;
  const x = (i: number) => left + step * (i + 0.5);
  const revenueY = (value: number) => baseline - (value / revenueMax) * (baseline - top);
  const marginY = (value: number) =>
    baseline - ((value - marginMin) / (marginMax - marginMin)) * (baseline - top);
  const cashY = (value: number) => 305 - (value / cashMax) * 48;
  const line = (value: (p: OverviewChartPoint) => number) =>
    points.map((p, i) => `${x(i)},${value(p)}`).join(" ");
  const revenueLine = `M ${points.map((p, i) => `${x(i)},${revenueY(p.revenue)}`).join(" L ")}`;
  const revenueArea = `${revenueLine} L ${x(points.length - 1)},${baseline} L ${x(0)},${baseline} Z`;
  const number = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 1 });

  function toggleMonth(period: string) {
    setPinned((current) => (current === period ? null : period));
  }

  return (
    <div className="chart-container">
      <div className="cashflow-bridge" role="region" tabIndex={0} aria-label={t("Monatsdiagramm")}>
        <svg
          viewBox={`0 0 ${width} 338`}
          role="group"
          aria-labelledby={`${titleId} ${descriptionId}`}
        >
          <defs>
            {(["good", "warning"] as const).map((status) => (
              <linearGradient
                key={status}
                id={`${titleId}-revenue-${status}`}
                gradientUnits="userSpaceOnUse"
                x1="0"
                x2="0"
                y1={top}
                y2={baseline}
              >
                <stop offset="0%" stopColor={`var(--status-${status})`} stopOpacity={0.42} />
                <stop offset="100%" stopColor={`var(--status-${status})`} stopOpacity={0.02} />
              </linearGradient>
            ))}
            {points.map((p, i) => (
              <clipPath key={p.period} id={`${titleId}-month-${p.period}`}>
                <rect x={left + step * i} y={top - 4} width={step} height={baseline - top + 8} />
              </clipPath>
            ))}
          </defs>
          <title id={titleId}>
            {t("Umsatz, Plan, EBITDA-Marge und liquide Mittel im Monatsverlauf")}
          </title>
          <desc id={descriptionId}>
            {t(
              "Umsatz links in Tsd. EUR, EBITDA-Marge rechts in Prozent. Liquide Mittel unten mit eigener Skala. Monat berühren oder per Tastatur auswählen; Details und Datentabelle darunter.",
            )}
          </desc>
          <text x={left} y={13} className="chart-axis">
            {t("Umsatz · Tsd. €")}
          </text>
          <text x={width - right} y={13} textAnchor="end" className="chart-axis">
            {t("EBITDA-Marge · %")}
            {" · "}
            {t("Margenziel")}: {number(marginTarget)}%
          </text>
          {[0, 1, 2, 3].map((i) => {
            const y = top + ((baseline - top) * i) / 3;
            return (
              <g key={i}>
                <line x1={left} x2={width - right} y1={y} y2={y} className="chart-gridline" />
                <text x={left - 12} y={y + 4} textAnchor="end" className="chart-axis">
                  {number((revenueMax * (1 - i / 3)) / 1000)}
                </text>
                <text x={width - right + 12} y={y + 4} className="chart-axis">
                  {number(marginMax - ((marginMax - marginMin) * i) / 3)}%
                </text>
              </g>
            );
          })}
          {points.map((p, i) => (
            <g key={p.period} clipPath={`url(#${titleId}-month-${p.period})`}>
              <path
                d={revenueArea}
                fill={`url(#${titleId}-revenue-${p.planMet ? "good" : "warning"})`}
              />
              <path
                d={revenueLine}
                fill="none"
                stroke={p.planMet ? "var(--status-good)" : "var(--status-warning)"}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle
                cx={x(i)}
                cy={revenueY(p.revenue)}
                r={active.period === p.period ? 5 : 3.5}
                fill={p.planMet ? "var(--status-good)" : "var(--status-warning)"}
              />
            </g>
          ))}
          <polyline
            points={line((p) => revenueY(p.budget))}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <line
            x1={left}
            x2={width - right}
            y1={marginY(marginTarget)}
            y2={marginY(marginTarget)}
            stroke="var(--muted)"
            strokeDasharray="2 5"
          />
          {points.slice(1).map((p, i) => {
            const previous = points[i];
            return p.margin === null || previous.margin === null ? null : (
              <line
                key={p.period}
                x1={x(i)}
                x2={x(i + 1)}
                y1={marginY(previous.margin)}
                y2={marginY(p.margin)}
                stroke="var(--ink)"
                strokeWidth="2.5"
              />
            );
          })}
          {points.map((p, i) =>
            p.margin === null ? null : (
              <circle key={p.period} cx={x(i)} cy={marginY(p.margin)} r={3.5} fill="var(--ink)" />
            ),
          )}
          <text x={left} y={240} className="chart-axis">
            {t("Liquide Mittel · Tsd. € · Monatsende")}
            {" · "}
            {t("Mindestbestand")}: {number(cashTarget / 1000)}
          </text>
          <text x={left - 12} y={261} textAnchor="end" className="chart-axis">
            {number(cashMax / 1000)}
          </text>
          <text x={left - 12} y={309} textAnchor="end" className="chart-axis">
            0
          </text>
          <line x1={left} x2={width - right} y1={305} y2={305} className="chart-gridline" />
          <line
            x1={left}
            x2={width - right}
            y1={cashY(cashTarget)}
            y2={cashY(cashTarget)}
            stroke="var(--muted)"
            strokeDasharray="2 5"
          />
          <polyline
            points={line((p) => cashY(p.cash))}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2"
          />
          {points.map((p, i) => {
            const selected = active.period === p.period;
            const label = `${t(p.month)}: ${t("Umsatz")} ${formatCompactCurrency(p.revenue, language)}, ${t("Plan")} ${formatCompactCurrency(p.budget, language)}, ${t("EBITDA-Marge")} ${formatValue(p.margin, "percent", language)}, ${t("Liquide Mittel")} ${formatCompactCurrency(p.cash, language)}`;
            return (
              <g
                key={p.period}
                role="button"
                tabIndex={0}
                aria-label={label}
                aria-pressed={pinned === p.period}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setPreview(p.period);
                }}
                onPointerLeave={() => setPreview(null)}
                onFocus={() => setPreview(p.period)}
                onBlur={() => setPreview(null)}
                onClick={() => toggleMonth(p.period)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleMonth(p.period);
                  }
                  if (event.key === "Escape") {
                    setPinned(null);
                    setPreview(null);
                  }
                }}
              >
                <title>{label}</title>
                {selected && (
                  <line
                    x1={x(i)}
                    x2={x(i)}
                    y1={top}
                    y2={305}
                    stroke="var(--ink)"
                    strokeDasharray="2 4"
                    opacity={0.45}
                  />
                )}
                <circle cx={x(i)} cy={cashY(p.cash)} r={selected ? 4 : 2.5} fill="var(--ink)" />
                <text x={x(i)} y={329} textAnchor="middle" className="chart-axis">
                  {t(p.month)}
                </text>
                <rect x={left + step * i} y={top} width={step} height={308} fill="transparent" />
              </g>
            );
          })}
        </svg>
      </div>
      <p className="chart-data" aria-live="polite">
        <strong>{t(active.month)}</strong>
        {" · "}
        {t(active.planMet ? "Plan erreicht" : "Unter Plan")}
        {" · "}
        {t("Umsatz")}: {formatCompactCurrency(active.revenue, language)}
        {" · "}
        {t("Plan")}: {formatCompactCurrency(active.budget, language)}
        {" · "}
        {t("Abweichung")}: {formatCompactCurrency(active.variance, language)} (
        {formatValue(active.variancePercent, "percent", language)}){" · "}
        EBITDA: {formatCompactCurrency(active.ebitda, language)}
        {" · "}
        {t("Marge")}: {formatValue(active.margin, "percent", language)}
        {" · "}
        {t("Liquide Mittel")}: {formatCompactCurrency(active.cash, language)}
      </p>
      <p className="chart-data">{t("Grün: Plan erreicht · Rot: unter Plan · Gepunktet: Ziele")}</p>
      <details className="chart-data">
        <summary>{t("Diagrammdaten anzeigen")}</summary>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">{t("Demowerte des Diagramms")}</caption>
            <thead>
              <tr>
                {[
                  "Monat",
                  "Umsatz",
                  "Plan",
                  "Abweichung",
                  "EBITDA",
                  "EBITDA-Marge",
                  "Liquide Mittel",
                ].map((label) => (
                  <th scope="col" key={label}>
                    {t(label)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.period}>
                  <th scope="row">{t(p.month)}</th>
                  <td>{formatCompactCurrency(p.revenue, language)}</td>
                  <td>{formatCompactCurrency(p.budget, language)}</td>
                  <td>{formatCompactCurrency(p.variance, language)}</td>
                  <td>{formatCompactCurrency(p.ebitda, language)}</td>
                  <td>{formatValue(p.margin, "percent", language)}</td>
                  <td>{formatCompactCurrency(p.cash, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
