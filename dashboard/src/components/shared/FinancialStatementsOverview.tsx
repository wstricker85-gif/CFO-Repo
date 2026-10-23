"use client";
import { useTranslation } from "@/components/i18n/Language";
import Link from "next/link";
import { useDemo } from "./DemoProvider";
import { getIncomeStatement, getBalanceStatement, getCashflowStatement } from "@/lib/statements";
import { formatCompactCurrency, formatDelta } from "@/lib/format";

export function FinancialStatementsOverview() {
  const { t, language } = useTranslation();

  const { period } = useDemo();
  const income = getIncomeStatement(period),
    balance = getBalanceStatement(period),
    cash = getCashflowStatement(period);
  const entries = [
    {
      href: "/guv",
      label: "GuV",
      title: "Vom Umsatz zum Ergebnis",
      value: formatCompactCurrency(income.netIncome, language),
      detail: "Ergebnis nach Steuern im Monat",
    },
    {
      href: "/bilanz",
      label: "Bilanz",
      title: "Vermögen und Finanzierung",
      value: formatCompactCurrency(balance.totals.assets, language),
      detail: "Bilanzsumme zum gewählten Stichtag",
    },
    {
      href: "/cashflow",
      label: "Cashflow",
      title: "Vom Ergebnis zur Liquidität",
      value: formatDelta(cash.cashChange, "currency", language),
      detail: "Veränderung der liquiden Mittel im Monat",
    },
  ];
  return (
    <section className="statement-entry-cards" aria-label={t("Bilanz, GuV und Cashflow öffnen")}>
      {entries.map((entry) => (
        <Link href={entry.href} key={entry.href}>
          <div>
            <span className="label">{t(entry.label)}</span>
            <span aria-hidden="true">↗</span>
          </div>
          <h2>{t(entry.title)}</h2>
          <strong>{t(entry.value)}</strong>
          <p>{t(entry.detail)}</p>
        </Link>
      ))}
    </section>
  );
}
