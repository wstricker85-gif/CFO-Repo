export default function Home() {
  return (
    <main className="max-w-wrap mx-auto px-card py-section">

      <h1 className="font-serif text-4xl text-ink mb-2">CFO Dashboard</h1>
      <p className="label mb-12">Design Token Preview</p>

      {/* Surfaces */}
      <section className="mb-10">
        <p className="label mb-4">Surfaces</p>
        <div className="flex gap-gap">
          <Token name="bg-bg" bg="bg-bg" border />
          <Token name="bg-panel" bg="bg-panel" border />
          <Token name="bg-wash" bg="bg-wash" border />
        </div>
      </section>

      {/* Brand */}
      <section className="mb-10">
        <p className="label mb-4">Brand</p>
        <div className="flex gap-gap">
          <Token name="bg-accent" bg="bg-accent" />
          <Token name="bg-accent-soft" bg="bg-accent-soft" />
        </div>
      </section>

      {/* Status */}
      <section className="mb-10">
        <p className="label mb-4">Status (RAG)</p>
        <div className="flex gap-gap">
          <Token name="bg-good" bg="bg-good" />
          <Token name="bg-watch" bg="bg-watch" />
          <Token name="bg-warning" bg="bg-warning" />
        </div>
      </section>

      {/* Chart series */}
      <section className="mb-10">
        <p className="label mb-4">Chart Series</p>
        <div className="flex gap-gap">
          <Token name="series-1" bg="bg-series-1" />
          <Token name="series-2" bg="bg-series-2" />
          <Token name="series-3" bg="bg-series-3" />
          <Token name="series-4" bg="bg-series-4" />
          <Token name="series-5" bg="bg-series-5" />
        </div>
      </section>

      {/* Typography */}
      <section className="mb-10">
        <p className="label mb-4">Typography</p>
        <div className="space-y-3 p-card bg-panel border border-line">
          <h2 className="font-serif text-3xl text-ink">Georgia — Headings (h1, h2)</h2>
          <p className="font-sans text-base text-ink">Inter — Body text, paragraphs, labels</p>
          <p className="font-mono text-xs text-muted uppercase tracking-widest">SFMono — Meta, eyebrows, labels</p>
          <p className="tabular text-ink text-2xl">€1,234,567.89 — Tabular numbers</p>
        </div>
      </section>

      {/* Borders & text */}
      <section className="mb-10">
        <p className="label mb-4">Text & Borders</p>
        <div className="p-card bg-panel border border-line space-y-2">
          <p className="text-ink">text-ink — Primary text</p>
          <p className="text-muted">text-muted — Secondary text, descriptions</p>
          <div className="border-t border-line pt-2 mt-2">
            <p className="text-muted text-sm">border-line — Dividers, card borders</p>
          </div>
        </div>
      </section>

    </main>
  );
}

function Token({ name, bg, border }: { name: string; bg: string; border?: boolean }) {
  return (
    <div className="flex flex-col gap-2 items-start">
      <div className={`w-16 h-16 ${bg} ${border ? "border border-line" : ""}`} />
      <span className="label">{name}</span>
    </div>
  );
}
