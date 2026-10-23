"use client";
import { useTranslation } from "@/components/i18n/Language";
import { useId } from "react";
import { MetricInfo } from "@/components/ui/MetricInfo";
import { summaryInsight, type MetricInsight } from "@/lib/insights";
import { formatCompactCurrency, formatValue } from "@/lib/format";

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const { t } = useTranslation();

  const id = useId();
  if (values.length < 2) return <span className="sparkline-empty">{t("Keine Zeitreihe")}</span>;
  const min = Math.min(...values),
    max = Math.max(...values),
    spread = max - min || 1;
  const path = values
    .map((v, i) => `${(i * 120) / (values.length - 1)},${34 - ((v - min) / spread) * 27}`)
    .join(" ");
  return (
    <svg className="sparkline" viewBox="0 0 120 40" role="img" aria-labelledby={id}>
      <title id={id}>
        {t(label)}: {t(values.map((v) => formatValue(v, "number")).join(", "))}
      </title>
      <polyline
        points={path}
        fill="none"
        stroke="var(--series-1)"
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
export function SummaryStat({
  label,
  value,
  detail,
  tone,
  insight,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: string;
  insight?: MetricInsight;
}) {
  const { t } = useTranslation();

  const explanation = insight ?? summaryInsight(label, value, detail);
  return (
    <article data-metric-hover={explanation ? "" : undefined} className="summary-stat">
      <div className="summary-stat-heading">
        <p className="label">{t(label)}</p>
        {explanation && <MetricInfo insight={explanation} />}
      </div>
      <strong className="tabular" data-status={tone}>
        {t(value)}
      </strong>
      <p>{t(detail)}</p>
    </article>
  );
}
export function HorizontalBars({
  rows,
}: {
  rows: { label: string; value: number; note?: string; color?: string }[];
}) {
  const { t } = useTranslation();

  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <div className="horizontal-bars">
      {rows.map((row) => (
        <div className="horizontal-bar-row" key={row.label}>
          <div>
            <span>{t(row.label)}</span>
            <strong className="tabular">{t(formatCompactCurrency(row.value))}</strong>
          </div>
          <div className="bar-track">
            <div
              style={{
                width: `${(Math.abs(row.value) / max) * 100}%`,
                background: row.color ?? "var(--series-1)",
              }}
            />
          </div>
          {row.note && <p>{t(row.note)}</p>}
        </div>
      ))}
    </div>
  );
}
