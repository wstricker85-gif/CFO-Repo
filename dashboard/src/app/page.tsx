import { KpiCard } from "@/components/ui/KpiCard";

export default function Home() {
  return (
    <main className="max-w-wrap mx-auto px-card py-section">

      <h1 className="font-serif text-4xl text-ink mb-2">CFO Dashboard</h1>
      <p className="label mb-12">Component Preview</p>

      {/* KpiCard — alle Status-Varianten */}
      <section className="mb-12">
        <p className="label mb-4">KpiCard — Status variants</p>
        <div className="grid grid-cols-2 gap-gap sm:grid-cols-4">
          <KpiCard
            label="EBITDA Margin"
            value="14.3%"
            delta="↑ +2.1% vs. Vormonat"
            status="good"
          />
          <KpiCard
            label="DSO"
            value="38 Tage"
            delta="↑ +4 Tage vs. Vormonat"
            hint="Ziel: < 30 Tage"
            status="watch"
          />
          <KpiCard
            label="Current Ratio"
            value="0.8×"
            delta="↓ −0.3 vs. Vorquartal"
            hint="Kritisch: < 1.0"
            status="warning"
          />
          <KpiCard
            label="Umsatz"
            value="€1.2M"
            delta="Kein Vorjahresvergleich"
            status="neutral"
          />
        </div>
      </section>

      {/* KpiCard — ohne Delta */}
      <section className="mb-12">
        <p className="label mb-4">KpiCard — ohne Delta</p>
        <div className="grid grid-cols-2 gap-gap sm:grid-cols-3">
          <KpiCard label="Gross Margin" value="41.8%" status="good" />
          <KpiCard label="Net Debt / EBITDA" value="3.2×" status="watch" />
          <KpiCard label="Cashbestand" value="€340K" status="neutral" />
        </div>
      </section>

    </main>
  );
}
