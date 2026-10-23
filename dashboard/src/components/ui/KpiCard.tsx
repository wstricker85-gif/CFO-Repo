"use client";
import { useTranslation } from "@/components/i18n/Language";
import Link from "next/link";
import type { MetricInsight } from "@/lib/insights";
import { MetricInfo } from "./MetricInfo";
import type { Metric } from "@/lib/contracts";
import {
  assessmentLabels,
  formatCompactCurrency,
  formatDelta,
  formatValue,
  statusLabels,
} from "@/lib/format";

export function KpiCard({
  metric,
  index,
  insight,
}: {
  metric: Metric;
  index: number;
  insight?: MetricInsight;
}) {
  const { t, language } = useTranslation();

  const comparison = metric.comparison;
  return (
    <article
      data-metric-hover={insight ? "" : undefined}
      className="kpi-card"
      aria-labelledby={`kpi-${metric.id}`}
    >
      <div className="kpi-top">
        <span className="label" id={`kpi-${metric.id}`}>
          {t(metric.label)}
        </span>
        <span className="kpi-meta">
          {insight && <MetricInfo insight={insight} />}
          <span className="kpi-index">0{index + 1}</span>
        </span>
      </div>
      <div className="kpi-value tabular">
        {t(
          metric.unit === "currency" && metric.value !== null
            ? formatCompactCurrency(metric.value, language)
            : formatValue(metric.value, metric.unit, language),
        )}
      </div>
      <div className="kpi-comparison" data-assessment={comparison?.assessment ?? "unknown"}>
        {comparison ? (
          <>
            <span aria-hidden="true">
              {t(comparison.direction === "up" ? "↗" : comparison.direction === "down" ? "↘" : "→")}
            </span>
            {t(" ")}
            {t(formatDelta(comparison.value, comparison.unit, language))}
            {t(" ")}
            <span className="sr-only">{t(assessmentLabels[comparison.assessment])}, </span>
            <span className="comparison-label">{t(comparison.label)}</span>
          </>
        ) : (
          "Kein Vergleich verfügbar"
        )}
      </div>
      <div className="kpi-bottom">
        <span className="status" data-status={metric.status}>
          <span className="status-dot" />
          {t(statusLabels[metric.status])}
        </span>
        <span className="kpi-target">{t(metric.target ?? metric.unavailable_reason)}</span>
      </div>
      {metric.id === "dso" && (
        <Link className="kpi-detail-link" href="/working-capital#ueberfaellig">
          {t(" Überfällige Forderungen prüfen ↗ ")}
        </Link>
      )}
    </article>
  );
}
