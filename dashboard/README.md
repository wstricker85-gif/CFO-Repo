# CFO Dashboard · Stricker Interim

German finance dashboard demonstrator with fifteen connected pages. Built with Next.js 16,
React 19, TypeScript, Tailwind 4 and Zod. Read ../AGENTS.md before development.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Start with the overview, then use the sidebar for KPI monitoring,
financial analysis, working capital, DCF, forecasting, fictional market assumptions,
board reporting and local CSV preview. The selected reporting month stays shared across
routes; other module-local drafts reset when navigating away. Theme preference persists.

```sh
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

Production builds use Webpack; development uses Turbopack with PostCSS. `npm run build:turbo`
can check Turbopack separately on machines without the CSS-worker port restriction.

All company and market values are fictional. The CSV preview is local and separate from
the demo company; it does not upload, store or transmit the chosen file. No AI runtime,
authentication, external market provider or production calculation backend is connected.

- Product and architecture: ../docs/architecture.md
- Review walkthrough: ../docs/review-guide.md
- Runtime agent contracts: src/lib/contracts.ts
- Deterministic demo calculations: src/lib/finance.ts
- Consistent company fixtures: src/lib/demo-company.ts

## Public demo export

Real-data integration is parked. Info buttons explain each KPI using current period,
target and scenario data; hover/focus opens them and click/tap pins them. The panels
contain deterministic demo interpretation, not an AI response.

```sh
npm run build:demo
```

Exports static files to `out/`, configured for `https://stricker-interim.de/cfo-demo/`.
Upload the contents into the website's `cfo-demo/` directory. Another mount path or a
standalone domain needs a rebuild with `CFO_DEMO_BASE_PATH` set appropriately. See
../docs/demo-publishing.md. Nothing is automatically uploaded or published.

Financial statements: `/guv` contains the complete management P&L through net income;
`/bilanz` compares balanced assets/liabilities at dates; `/cashflow` reconciles
historical operating, investing and financing cashflows to closing cash. These pages
support details, scale, comparisons and CSV. See `src/lib/demo-ledger.ts` and
`src/lib/statements.ts` for the connected fixtures and deterministic calculations.

HGB-to-IFRS demo: `/ifrs` shows selected leasing and development adjustments,
automatic deferred taxes, a reconciled equity waterfall, balance/P&L bridge and
debit/credit journal. The fictional HGB source remains unchanged. Methodology and
primary standard references are included in the module; this is not IFRS 1 adoption.

The local CSV preview supports the original five required fields plus optional
P&L, plan and closing balance fields. Its downloadable twelve-month sample powers
a standalone local analysis, comparisons and charts; dashboard snapshots stay
separate. See `src/lib/csv.ts` and `src/lib/csv-analysis.ts`.

The guided tour covers all fifteen pages in five chapters. Header controls and
the overview entry start/resume it; progress survives client navigation only,
not a refresh. Exercises are optional. The in-flow desktop rail becomes a
collapsed bottom strip on smaller screens. See `src/lib/tour.ts` for content and
tested progress transitions. The separately added market API currently prevents
static export; the server build works.

`/projekt` describes the tailored CFO dashboard offering in cooperation with Swissi
Holding AG. Privacy/compliance controls are scoped to the individual production
project. The demo itself still does not run AI.
