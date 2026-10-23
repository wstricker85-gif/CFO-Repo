"use client";
import { useTranslation } from "@/components/i18n/Language";
import Link from "next/link";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="overview">
      <div className="empty-state">
        <span aria-hidden="true">404</span>
        <h1>{t("Diese Seite ist nicht vorhanden.")}</h1>
        <p>{t("Über die Navigation gelangst du zu den verfügbaren Dashboard-Modulen.")}</p>
        <Link className="button" href="/">
          {t("Zur Übersicht ↗")}
        </Link>
      </div>
    </div>
  );
}
