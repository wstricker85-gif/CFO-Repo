"use client";
import { useTranslation } from "@/components/i18n/Language";
import { useState, useSyncExternalStore } from "react";
import { metricInsight } from "@/lib/insights";
import { MetricInfo } from "@/components/ui/MetricInfo";
import { getKpis, type KpiDefinition } from "@/lib/demo-company";
import { type Threshold } from "@/lib/finance";
import { downloadCsv } from "@/lib/export";
import { formatCompactCurrency, formatValue, statusLabels } from "@/lib/format";
import { useDemo } from "@/components/shared/DemoProvider";
import { EmptyState, ModulePage, Panel } from "@/components/shared/ModulePage";
import { Sparkline, SummaryStat } from "@/components/shared/Visuals";

const subscribeHash = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};
export function KpiMonitor() {
  const { t } = useTranslation();

  const { period, rules, setRules } = useDemo();
  const [category, setCategory] = useState("Alle");
  const [status, setStatus] = useState("Alle");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditing] = useState<boolean | null>(null);
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => "",
  );
  const editing = editorOpen ?? hash === "#zielwerte";
  const [error, setError] = useState("");
  const definitions = getKpis(period, rules);
  const filtered = definitions.filter(
    (d) =>
      (category === "Alle" || d.category === category) &&
      (status === "Alle" || d.metric.status === status) &&
      t(d.metric.label).toLocaleLowerCase().includes(search.toLocaleLowerCase("de")),
  );
  const counts = (s: string) => definitions.filter((d) => d.metric.status === s).length;
  function exportData() {
    downloadCsv(`KPI-Monitor-Demo-${period}.csv`, [
      ["DEMODATEN", period],
      ["KPI", "Kategorie", "Wert", "Einheit", "Status", "Formel"],
      ...definitions.map((d) => [
        d.metric.label,
        d.category,
        d.metric.value,
        d.metric.unit,
        statusLabels[d.metric.status],
        d.formula,
      ]),
    ]);
  }
  function saveRules(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: Record<string, Threshold> = { ...rules };
    for (const d of definitions.filter((k) =>
      ["dso", "ebitda-margin", "concentration", "cash"].includes(k.metric.id),
    )) {
      const good = Number(data.get(`${d.metric.id}-good`)),
        watch = Number(data.get(`${d.metric.id}-watch`));
      const direction = d.rule!.direction;
      if (
        !Number.isFinite(good) ||
        !Number.isFinite(watch) ||
        good < 0 ||
        watch < 0 ||
        (direction === "higher" ? good <= watch : good >= watch)
      ) {
        setError(
          "Bitte gültige Grenzen eingeben: Bei höheren Zielwerten liegt Grün über Gelb, bei niedrigeren darunter.",
        );
        return;
      }
      next[d.metric.id] = { good, watch, direction };
    }
    setRules(next);
    setEditing(false);
    setError("");
  }
  return (
    <ModulePage
      eyebrow={t("KPI Monitor")}
      title={
        <>
          {t(" Signale erkennen. ")}
          <em>{t("Gezielt handeln.")}</em>
        </>
      }
      description={t("Ertrag, Liquidität und Risiken mit transparenten Zielwerten überwachen.")}
      action={
        <button className="button" onClick={exportData}>
          {t(" CSV exportieren ↗ ")}
        </button>
      }
    >
      <div className="summary-grid">
        <SummaryStat
          label={"Im Ziel"}
          value={String(counts("good"))}
          detail={t("Kennzahlen erreichen den Demo-Zielwert")}
          tone="good"
        />
        <SummaryStat
          label={"Beobachten"}
          value={String(counts("watch"))}
          detail={t("Kennzahlen außerhalb des Zielkorridors")}
          tone="watch"
        />
        <SummaryStat
          label={"Handlungsbedarf"}
          value={String(counts("warning"))}
          detail={t("Kennzahlen über der Eingriffsgrenze")}
          tone="warning"
        />
        <SummaryStat
          label={"Datenlücke"}
          value={String(counts("unavailable"))}
          detail={t("Personaldaten noch nicht vorhanden")}
        />
      </div>
      <div className="module-toolbar" id="zielwerte">
        <div className="filter-pills" role="group" aria-label={t("KPI-Kategorie")}>
          {["Alle", "Ertrag", "Liquidität", "Effizienz", "Risiko"].map((c) => (
            <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>
              {t(c)}
            </button>
          ))}
        </div>
        <button
          className="button"
          aria-expanded={editing}
          aria-controls="threshold-settings"
          onClick={() => setEditing(!editing)}
        >
          {t(" Zielwerte anpassen ")}
        </button>
      </div>
      {editing && (
        <Panel index="Konfiguration / Demo" title={t("Eigene Zielkorridore")}>
          <form id="threshold-settings" onSubmit={saveRules} className="threshold-form">
            <p>
              {t(
                " Gilt für Übersicht, KPI-Monitor, Liquiditätsreserve und Bericht. Nur in dieser Sitzung; Neuladen setzt die Standardziele zurück. ",
              )}
            </p>
            <div className="threshold-grid">
              {definitions
                .filter((d) =>
                  ["dso", "ebitda-margin", "concentration", "cash"].includes(d.metric.id),
                )
                .map((d) => (
                  <fieldset key={d.metric.id}>
                    <legend>{t(d.metric.label)}</legend>
                    <label>
                      {t(" Grün ")}
                      {t(d.rule!.direction === "higher" ? "ab" : "bis")}
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        name={`${d.metric.id}-good`}
                        defaultValue={d.rule!.good}
                      />
                    </label>
                    <label>
                      {t(" Gelb ")}
                      {t(d.rule!.direction === "higher" ? "ab" : "bis")}
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        name={`${d.metric.id}-watch`}
                        defaultValue={d.rule!.watch}
                      />
                    </label>
                  </fieldset>
                ))}
            </div>
            {error && (
              <p className="form-error" role="alert">
                {t(error)}
              </p>
            )}
            <div className="form-actions">
              <button className="button primary-button" type="submit">
                {t(" Zielwerte anwenden ")}
              </button>
              <button
                className="button"
                type="button"
                onClick={() => {
                  setRules({});
                  setEditing(false);
                  setError("");
                }}
              >
                {t(" Standard wiederherstellen ")}
              </button>
            </div>
          </form>
        </Panel>
      )}
      <div className="filter-row">
        <label className="search-control">
          <span className="sr-only">{t("KPI suchen")}</span>
          <input
            type="search"
            placeholder={t("Kennzahl suchen …")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="select-control">
          {t(" Status ")}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Alle">{t("Alle")}</option>
            {["good", "watch", "warning", "unavailable"].map((s) => (
              <option value={s} key={s}>
                {t(statusLabels[s as keyof typeof statusLabels])}
              </option>
            ))}
          </select>
        </label>
        <span className="results-count" role="status">
          {filtered.length} {t(" von ")}
          {definitions.length} {t(" Kennzahlen ")}
        </span>
      </div>
      {Object.keys(rules).length > 0 && (
        <p className="inline-note">
          {t(
            " Eigene Zielwerte aktiv · Übersicht, Liquiditätsreserve und Berichte verwenden dieselben Ziele. ",
          )}
        </p>
      )}
      {filtered.length ? (
        <div className="monitor-grid">
          {filtered.map((d) => (
            <MonitorCard key={d.metric.id} definition={d} overridden={!!rules[d.metric.id]} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("Keine passenden Kennzahlen")}
          description={t("Suchbegriff oder Filter ändern, um weitere Kennzahlen anzuzeigen.")}
        />
      )}
      <div className="methodology-note">
        <strong>{t("Transparente Bewertung")}</strong>
        <p>
          {t(
            " Schwellenwerte sind beispielhafte Zielvorgaben des Demounternehmens. Richtung und Bewertung einer Veränderung sind unabhängig vom aktuellen Status. Für nicht vorhandene Zeitreihen wird kein Trend erfunden. ",
          )}
        </p>
      </div>
    </ModulePage>
  );
}
function MonitorCard({
  definition: d,
  overridden,
}: {
  definition: KpiDefinition;
  overridden: boolean;
}) {
  const { t } = useTranslation();

  const { metric: m } = d;
  const { snapshot } = useDemo();
  return (
    <article data-metric-hover="" className="panel monitor-card">
      <div className="monitor-card-top">
        <span className="label">{t(d.category)}</span>
        <span className="status" data-status={m.status}>
          <span className="status-dot" />
          {t(statusLabels[m.status])}
        </span>
      </div>
      <div className="metric-heading">
        <h2>{t(m.label)}</h2>
        <MetricInfo
          insight={metricInsight(m, {
            period: snapshot.label,
            description: d.description,
            formula: d.formula,
            rule: d.rule,
          })}
        />
      </div>
      <div className="monitor-value-row">
        <strong className={`tabular ${m.value === null ? "unavailable-value" : ""}`}>
          {t(
            m.unit === "currency" && m.value !== null
              ? formatCompactCurrency(m.value)
              : formatValue(m.value, m.unit),
          )}
        </strong>
        <Sparkline values={d.history} label={t(m.label)} />
      </div>
      <p className="monitor-target">
        {t(overridden ? "Eigener Zielwert" : "Demo-Ziel")}:{t(" ")}
        {t(
          d.rule
            ? `${d.rule.direction === "higher" ? "≥" : "≤"} ${formatValue(d.rule.good, m.unit)}`
            : m.target,
        )}
      </p>
      <details className="metric-details">
        <summary>{t("Definition & Datenbasis")}</summary>
        <p>{t(d.description)}</p>
        <code>{t(d.formula)}</code>
        <p>
          {t(" Quelle: fiktiver Demo-Monatsabschluss.")}
          {t(" ")}
          {t(
            d.history.length > 1
              ? "Zeitreihe: Januar bis Berichtsmonat."
              : "Keine historische Zeitreihe hinterlegt.",
          )}
        </p>
        {m.unavailable_reason && <p>{t(m.unavailable_reason)}</p>}
      </details>
    </article>
  );
}
