"use client";
import { getLocale } from "@/lib/i18n";
import { useTranslation } from "@/components/i18n/Language";
import { useDemo } from "./DemoProvider";

export function PeriodSelect() {
  const { t } = useTranslation();

  const { snapshots, period, setPeriod } = useDemo();
  return (
    <label className="period-control">
      <span className="sr-only">{t("Berichtsmonat")}</span>
      <svg
        aria-hidden="true"
        width="15"
        height="15"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
      >
        <rect x="3" y="4" width="14" height="13" />
        <path d="M3 8h14M7 2v4m6-4v4" />
      </svg>
      <select value={period} onChange={(event) => setPeriod(event.target.value)}>
        {snapshots.map((s) => (
          <option value={s.id} key={s.id}>
            {t(s.label)}
          </option>
        ))}
      </select>
    </label>
  );
}
export function DataContext({ label = "Monatswerte" }: { label?: string }) {
  const { t } = useTranslation();

  const { snapshot } = useDemo();
  const date = new Intl.DateTimeFormat(getLocale(), { timeZone: "UTC" }).format(
    new Date(snapshot.result.period.end),
  );
  return (
    <div className="data-context">
      <span className="demo-context">
        <span className="context-square" aria-hidden="true" />
        {t(" Demo-Arbeitsbereich ")}
      </span>
      <span>
        {t("Fiktive Daten · Monatsabschluss ")}
        {t(date)}
      </span>
      <span className="context-currency">
        {t("EUR · ")}
        {t(label)}
      </span>
    </div>
  );
}
export function ModulePage({
  eyebrow,
  title,
  description,
  action,
  children,
  context,
  showPeriod = true,
  showContext = true,
  footerNote = "Demo · Fiktive Daten · Keine ausgeführte KI-Analyse",
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  context?: string;
  showPeriod?: boolean;
  showContext?: boolean;
  footerNote?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="overview module-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {t(" Finance Cockpit ")}
            <span>/</span> {t(eyebrow)}
          </p>
          <h1>{title}</h1>
          <p className="page-intro">{t(description)}</p>
        </div>
        {(showPeriod || action) && (
          <div className="page-controls">
            {showPeriod && <PeriodSelect />}
            {action}
          </div>
        )}
      </div>
      {showContext && <DataContext label={t(context)} />}
      {children}
      <footer className="overview-footer">
        <span>
          {t(" STRICKER INTERIM ")}
          <span aria-hidden="true">/</span> {t(" CFO Dashboard ")}
        </span>
        <span>{t(footerNote)}</span>
      </footer>
    </div>
  );
}
export function Panel({
  index,
  title,
  action,
  children,
  className = "",
}: {
  index: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <section className={`panel module-panel ${className}`}>
      <div className="panel-heading">
        <div>
          <p className="label">{t(index)}</p>
          <h2>{t(title)}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  const { t } = useTranslation();

  return (
    <div className="empty-state" role="status">
      <span aria-hidden="true">∅</span>
      <h3>{t(title)}</h3>
      <p>{t(description)}</p>
    </div>
  );
}
