"use client";
import { LanguageToggle, useTranslation } from "@/components/i18n/Language";
import Link from "next/link";
import { TourLauncher } from "@/components/shared/DemoGuide";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="mast">
      <Link href="/" className="brand" aria-label={t("Stricker Interim – Dashboard-Übersicht")}>
        <span className="brand-mark" aria-hidden="true">
          {t(" W ")}
        </span>
        <span>
          {t(" STRICKER ")}
          <span className="brand-muted">{t("INTERIM")}</span>
        </span>
      </Link>
      <div className="mast-divider" aria-hidden="true" />
      <span className="mast-product">{t("CFO Dashboard")}</span>
      <div className="mast-right">
        <TourLauncher />
        <a className="website-backlink" href="https://stricker-interim.de/">
          {t(" Zur Website ")}
          <span aria-hidden="true">↗</span>
        </a>
        <span className="demo-badge">{t("Demo")}</span>
        <LanguageToggle />
        <ThemeToggle />
        <span className="avatar" aria-label={t("Demo-Arbeitsbereich")}>
          {t(" WS ")}
        </span>
      </div>
    </header>
  );
}
