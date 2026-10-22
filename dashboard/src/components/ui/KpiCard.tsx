// KpiCard — displays a single financial metric with RAG status and trend delta.
// Status controls the left border color (good=green, watch=amber, warning=red, critical=red).

type Status = "good" | "watch" | "warning" | "critical" | "neutral";

type KpiCardProps = {
  label: string;       // e.g. "EBITDA Margin"
  value: string;       // e.g. "14.3%" — already formatted, never raw numbers
  delta?: string;      // e.g. "+2.1% vs. Vormonat" — optional
  status?: Status;     // controls border color — defaults to neutral
  hint?: string;       // optional second line of context below delta
};

const borderColor: Record<Status, string> = {
  good:     "border-l-good",
  watch:    "border-l-watch",
  warning:  "border-l-warning",
  critical: "border-l-warning",
  neutral:  "border-l-line",
};

const deltaColor: Record<Status, string> = {
  good:     "text-good",
  watch:    "text-watch",
  warning:  "text-warning",
  critical: "text-warning",
  neutral:  "text-muted",
};

export function KpiCard({ label, value, delta, status = "neutral", hint }: KpiCardProps) {
  return (
    <div className={`bg-panel border border-line border-l-4 ${borderColor[status]} p-card flex flex-col gap-3`}>

      {/* Label row */}
      <span className="label">{label}</span>

      {/* Value — large, tabular so digits align across cards */}
      <span className="tabular font-sans text-2xl font-medium text-ink leading-none">
        {value}
      </span>

      {/* Delta + hint — only rendered if provided */}
      {(delta || hint) && (
        <div className="flex flex-col gap-0.5">
          {delta && (
            <span className={`font-mono text-xs ${deltaColor[status]}`}>
              {delta}
            </span>
          )}
          {hint && (
            <span className="font-mono text-xs text-muted">{hint}</span>
          )}
        </div>
      )}

    </div>
  );
}
