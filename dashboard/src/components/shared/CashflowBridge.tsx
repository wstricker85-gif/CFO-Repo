"use client";
import { useTranslation } from "@/components/i18n/Language";
import { useId } from "react";
import { formatCompactCurrency, formatDelta } from "@/lib/format";

export function CashflowBridge({
  stages,
  title: chartTitle = "Vom Anfangs- zum Endbestand der liquiden Mittel",
  description = "Operative, Investitions- und Finanzierungsbeiträge überleiten die Bankbestände.",
  regionLabel = "Cashflow-Brücke, horizontal scrollbar",
}: {
  title?: string;
  description?: string;
  regionLabel?: string;
  stages: { label: string; from: number; to: number; value: number; total: boolean }[];
}) {
  const { t } = useTranslation();

  const title = useId(),
    desc = useId();
  const max = Math.max(...stages.flatMap((s) => [s.from, s.to]), 1),
    min = Math.min(0, ...stages.flatMap((s) => [s.from, s.to]));
  const y = (value: number) => 44 + ((max - value) / (max - min || 1)) * 170;
  return (
    <div className="cashflow-bridge" tabIndex={0} role="region" aria-label={t(regionLabel)}>
      <svg viewBox="0 0 820 265" role="img" aria-labelledby={`${title} ${desc}`}>
        <title id={title}>{t(chartTitle)}</title>
        <desc id={desc}>
          {t(stages.map((s) => `${s.label}: ${formatCompactCurrency(s.value)}`).join(". "))}.
          {t(description)}
        </desc>
        <line x1="28" x2="800" y1={y(0)} y2={y(0)} stroke="var(--line)" />
        {stages.map((stage, index) => {
          const x = 48 + index * 155;
          const top = Math.min(y(stage.from), y(stage.to)),
            height = Math.max(2, Math.abs(y(stage.from) - y(stage.to)));
          const fill = stage.total
            ? "var(--series-1)"
            : stage.value >= 0
              ? "var(--flow-in)"
              : "var(--flow-out)";
          return (
            <g key={stage.label}>
              <rect x={x} width="95" y={top} height={height} fill={fill} />
              <text
                x={x + 47.5}
                y={Math.max(21, top - 12)}
                textAnchor="middle"
                className="cashflow-bridge-value"
              >
                {t(
                  stage.total
                    ? formatCompactCurrency(stage.value)
                    : formatDelta(stage.value, "currency"),
                )}
              </text>
              <text x={x + 47.5} y="244" textAnchor="middle" className="cashflow-bridge-label">
                {t(stage.label)}
              </text>
              {index < stages.length - 1 && (
                <line
                  x1={x + 95}
                  x2={x + 155}
                  y1={y(stage.to)}
                  y2={y(stage.to)}
                  stroke="var(--muted)"
                  strokeDasharray="3 4"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
