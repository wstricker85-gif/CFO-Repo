"use client";
import { useTranslation } from "@/components/i18n/Language";
export function StatementControls({
  ytd,
  setYtd,
  scale,
  setScale,
  details,
  setDetails,
}: {
  ytd?: boolean;
  setYtd?: (value: boolean) => void;
  scale: "eur" | "thousand";
  setScale: (value: "eur" | "thousand") => void;
  details: boolean;
  setDetails: (value: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="module-toolbar statement-controls">
      {setYtd && (
        <div className="filter-pills" role="group" aria-label={t("Abschlusszeitraum")}>
          <button aria-pressed={!ytd} onClick={() => setYtd(false)}>
            {t(" Monat ")}
          </button>
          <button aria-pressed={ytd} onClick={() => setYtd(true)}>
            {t(" Januar bis Stichtag ")}
          </button>
        </div>
      )}
      <div className="statement-control-right">
        <div className="segmented" role="group" aria-label={t("Einheit der Abschlusstabellen")}>
          <button aria-pressed={scale === "eur"} onClick={() => setScale("eur")}>
            {t(" EUR ")}
          </button>
          <button aria-pressed={scale === "thousand"} onClick={() => setScale("thousand")}>
            {t(" Tsd. € ")}
          </button>
        </div>
        <label className="checkbox-control">
          <input type="checkbox" checked={details} onChange={(e) => setDetails(e.target.checked)} />
          {t(" Detailpositionen ")}
        </label>
      </div>
    </div>
  );
}
