"use client";
import { useTranslation } from "@/components/i18n/Language";
export function StatementAnalysis({
  title,
  points,
}: {
  title: string;
  points: { label: string; text: string }[];
}) {
  const { t } = useTranslation();

  return (
    <section className="statement-analysis" aria-label={t(title)}>
      <div className="statement-analysis-heading">
        <span className="label">{t("Analyse / Beispieldaten")}</span>
        <h2>{t(title)}</h2>
      </div>
      <div className="statement-analysis-points">
        {points.map((point) => (
          <div key={point.label}>
            <strong>{t(point.label)}</strong>
            <p>{t(point.text)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
