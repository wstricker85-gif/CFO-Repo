# CFO Dashboard — architecture and current implementation

## Implemented

Next.js 16.4.2 / React 19 / TypeScript / Tailwind 4 / Zod, German UI, dark/light
themes, shared month selection and responsive navigation. All data is explicitly
fictional. No external API calls, AI requests or confidential-data persistence.

| Route | Implemented behavior |
|---|---|
| `/` | Core metrics, period/range selection, revenue/EBITDA chart, management briefing, P&L, CSV |
| `/kpi` | Twelve KPIs, search/category/status filters, trends, formulas, module-local thresholds, CSV |
| `/analyse` | Monthly/YTD operating P&L, additive EBITDA bridge, cost structure, CSV |
| `/guv` | Full management P&L through net income, month/YTD, actual/plan, earnings trends, analysis, CSV |
| `/bilanz` | Balanced assets/liabilities, prior-month/year-opening comparison, capital structure, analysis, CSV |
| `/cashflow` | Indirect historical cashflow, operating/investing/financing, bank reconciliation, analysis, CSV |
| `/working-capital` | DSO/DIO/DPO/CCC/NWC, aging, invoice search/sort/filter/export, DSO release scenario, cash forecast |
| `/bewertung` | Five-year DCF, explicit cashflow assumptions, three presets/sliders, growth/WACC matrix, CSV |
| `/budget` | Locked YTD actuals, remaining-year scenarios, variable/fixed cost drivers, annual landing, CSV |
| `/markt` | Explicit fictional FX/peer assumptions, currency calculator, provider readiness, CSV |
| `/board` | Deterministic report template, format/sections/notes, Markdown export, browser print layout |
| `/daten` | Local CSV/TSV validation, German/English aliases and decimals, example/template, preview and export |

The CSV preview stays separate from the fictitious company. A partial file cannot
silently replace a complete financial dataset. File contents are held in browser
memory only and are not sent to any server or AI provider. No automatic localStorage
storage of financial data. Theme preference is the only persistent browser setting.
Module-local drafts (report notes, custom thresholds/scenarios) are not persisted;
export before navigating away if they should be retained.

## Code responsibilities

- `components/shared/DemoProvider.tsx`: period state shared across routes through root layout.
- `lib/demo-data.ts`: validated original overview snapshots and revenue history.
- `lib/demo-company.ts`: consistent demo P&L, balance assumptions, KPIs, invoices and forecast inputs.
- `lib/finance.ts`: pure deterministic demo arithmetic, DCF, scenario and cashflow helpers.
- `lib/demo-ledger.ts`: ten closing balance fixtures (Dec 2025–Sep 2026) and explicit monthly movements.
- `lib/statements.ts`: signed P&L, date-based balance views, indirect cashflow and reconciliation.
- `lib/contracts.ts`: strict versioned product-agent result schemas. No runtime agent execution.
- `lib/csv.ts`: local CSV/TSV parsing and fail-closed P&L validation.
- `lib/export.ts`: decimal-aware CSV output, formula-string escaping and file downloads.
- `lib/report.ts`: deterministic report construction preserving period and caveats.

The future production calculation engine remains Python/FastAPI. Current browser
calculations are limited to the demonstrator; they are not performed by language
models. Migration must preserve tested contracts and financial reference cases.

## Financial conventions

Amounts are EUR; percentages use percentage units (16.4 means 16.4%). Margin deltas
use percentage points. Missing values are null with a reason; zero is a real value.
Numeric direction, business assessment and current status remain separate fields.

Working-capital ratios use the actual number of calendar days in the month. Closing
balances stand in for average balances and COGS for purchases; both proxies are visible.
Invoice aging ties exactly to the balance and the >30-day amount in the overview.
YTD P&L and future-year forecast are separated; scenario changes never alter actuals.
DCF uses EBIT after modeled taxes plus depreciation less capex and incremental NWC;
WACC must exceed perpetual growth. DCF starting revenue is annualized YTD, not a
seasonality-adjusted forecast. Annualized leverage EBITDA is not trailing 12 months.
Forecast cash receipts/payments are independent assumptions, not a fictional invoice
collection engine. DSO-release potential is not added to cash forecasts automatically.

## Planned — not implemented

- Production Python/FastAPI engine and accounting-grade calculation validation.
- Auth, authorized company/tenant scope, upload persistence, reconciliation and audit trail.
- Full CSV/Excel canonical importer with chart-of-accounts mapping and complete balance data.
- Agent runtime, approved tools, routing execution, retries/timeouts, source verification.
- Live market adapters/cache and company-specific peer/methodology selection.
- Protected deployment and website embedding.

## Target production flow

Upload → canonical records → deterministic engine → validated metrics → selected
interpretation agents → validated result → dashboard/report. Market-only requests
use provider adapters and require no company upload. Application code enforces
company scope, tool permissions, dependencies and evidence matching. Schema validation
alone does not establish mathematical correctness, authorization or source authenticity.

## Design reference

Read-only reference: `../stricker-interim-website/index.html`, Stricker Interim,
canonical URL https://stricker-interim.de/. Keep Georgia headings, Inter/Arial body
stack, SFMono labels, warm neutrals, red-orange brand accent and square bordered panels.
The website's system font stack avoids external font requests. Brand accent is for
navigation/controls; financial series have distinct tokens. Status colors vary by theme
for legibility, with accompanying text. Tables scroll within their containers on mobile.

## Build and verification

`npm run build` uses the supported Webpack bundler and succeeds in this environment.
`npm run dev` keeps Turbopack; the Tailwind integration uses standard PostCSS.
`npm run build:turbo` is available, but this session's Turbopack build workers cannot
bind the local port they require. This environmental limitation does not prevent the
Webpack production build.

The original styling failure was reproduced as stale preview CSS delivered alongside
new markup. Replacing the custom Tailwind Turbopack loader with @tailwindcss/postcss
restored current CSS. HTTP checks now cover all nine routes, navigation/landmarks,
stylesheet delivery and module selectors, mobile rules and print layout. Browser
interaction/screenshot QA is still outstanding because no browser is connected.

Tests cover result contracts/dependency plans, missing and invalid values, accounting
reconciliation, invoice aging, DCF reference values, scenario/cash identities, FX,
report content and CSV import/export including formula-injection strings.

## Current focus: public interactive demo

Real-data ingestion and production backend work are parked. The active deliverable is
an explanatory, shareable demo with fictional company data. Info buttons on overview,
KPI catalog and module summary cards show concise definitions, current-value context,
formulas and limitations. The text is deterministic and responds to month, threshold
or scenario changes; it is not presented as an executed AI analysis.

The text-only tooltip opens on mouse hover and keyboard focus. Click/tap pins it;
a second activation, outside tap/click or Escape closes it. Text remains hoverable,
only one panel opens at a time, and it is positioned outside card overflow contexts.
Info buttons and panels are hidden in print.

`npm run build:demo` adds a fully static export under `dashboard/out/` with the
build-time base path `/cfo-demo` and trailing-slash routes. Regular development and
server builds retain root routes. Static export disables cache-components/partial
prefetch settings that require the server build. Set `CFO_DEMO_BASE_PATH` at build
time to choose another mount path or an empty value for a standalone domain.
See demo-publishing.md for packaging and publication steps. Nothing has been uploaded.

## Connected financial statements

The earlier equity/total-assets placeholders are replaced with a balanced monthly
closing series. Existing cash, debt, revenue, EBITDA, receivables and inventory remain
consistent with the established overview and working-capital figures. Equity now
includes actual demo YTD net income. No dividends or capital contributions are assumed.

September example: EBITDA 210,000; depreciation 24,000; interest 11,000; tax 52,500;
net income 122,500 EUR. Operating cashflow 184,000, investing -60,000, financing
-50,000; opening cash 768,000 + net movement 74,000 = closing cash 842,000 EUR.
GuV YTD profit equals the balance's running result. Fixed assets roll forward by
recorded capex less depreciation. There is no balancing row in the cashflow.

Cashflow begins with post-tax profit; depreciation and provision changes are added
back, operating stock changes are bridged, and capex/debt movements are separate.
Tax expense is not deducted twice: paid taxes equal expense less increase in tax
liabilities. Interest is paid in the same month and classified operating in this demo.
No noncash debt movements, disposals, FX, acquisition or lease movements are modeled.
Free cashflow here means operating plus investing cashflow, distinct from valuation FCF.

New statement pages include explanatory info buttons, analysis text, month/YTD or
comparison-date controls, EUR/thousand-EUR table display, detail toggle and full CSV
export. Dashboard entry cards and board-report summary link the statements together.
All numbers remain fictional; this is a management presentation, not an audited
statutory filing. Historical cashflow is separate from the existing cash forecast.

Latest verification: 51 passing tests including all balance/GuV/cashflow links, signed
actual/plan identities and month/YTD additivity. Twelve dashboard pages are exported.
Browser screenshot/click QA remains outstanding without a connected browser.

## Guided public demo and shared targets

`DemoProvider` owns session-only threshold overrides and guided-tour state. Pure
`demo-policy.ts` validates thresholds and applies their classification to snapshot
metrics without changing ledger balances, booked cash movements or comparisons.
`getKpis(period, rules)` is shared by overview, KPI monitor, assumptions and report.
Cash reserve views use the same cash target. Refresh resets overrides; no persistence.
The assumptions page discloses fixed historical methods separately from local budget,
DCF and payment-plan scenarios. Reports export the active targets for traceability.

The optional three-stop tour connects overview, working capital and historical cashflow.
`/working-capital#ueberfaellig` selects invoices more than 30 days overdue, using a
hydration-safe hash subscription compatible with static export. Manual filters can
override that preset. Metric hover panels show a short assessment; trigger activation
opens a nonmodal definition/formula dialog. The website contact link is an ordinary
external link; no contact data is sent by the demo.

Hover stability: info panels are positioned outside the whole metric card, with
available-space height limits. Card and portal share delayed-close checks; opening
an already visible hover panel is idempotent. The info trigger stays stationary so
its own hover appearance cannot move its hit area out from under the pointer.

Navigation group captions use a contrasting surface, ink-colored semibold text and
a brand-accent left border. Dedicated group selectors preserve legibility on narrow
sidebars and in both themes without changing the active-page indicator.

## HGB → IFRS demonstration

`src/lib/ifrs.ts` is a pure, tested financial model, alongside `finance.ts` and
`statements.ts`. It reads existing closing balances and P&L as the fictional HGB
base, without mutating them. The `/ifrs` client module owns two case-selection
switches and presentation controls. All adjustments, balance rows, income rows and
equity bridge values derive from one debit/credit adjustment journal.

Scope: a new lease and a qualifying development project beginning 1 January 2026;
no opening retained-earnings adjustment or other IFRS 1 first-time adoption work.
The lease uses 60 end-of-month payments of EUR 12000, a 0.5% monthly discount rate
and linear right-of-use depreciation. The HGB base assumes off-balance-sheet rent.
Development assumes the HGB capitalization option is not exercised, all IAS 38
criteria met from January, EUR 18000 qualifying costs monthly, and availability
for use only in January 2027. Existing costs contain these amounts.

Deferred tax is automatic for the active cases: 30%, zero additional tax bases,
sufficient future taxable profits assumed, gross assets/liabilities with no offset.
Journal changes to tax balances feed period profit; the initial lease's equal
deferred tax debit/credit has no net opening equity effect. No additional cash
is created. Cashflow classifications and liability maturity splits are outside scope.
The assumptions and official IFRS Foundation / HGB references are visible in the UI.

Tests cover all four switch combinations in both reporting months and both income
periods, balance equality, booked-figure preservation, equity-to-YTD-income identity,
monthly rollforwards, tax balances, PV/depreciation references, and invalid selections.
The existing cashflow bridge component accepts optional chart labels for reuse.

The deferred-tax case card includes the shared stable hover/focus/touch info panel.
Its short explanation distinguishes expected future tax relief/burden from a current
payment; activation adds an illustrative development-cost example and recognition
conditions. The IAS 12 primary reference remains linked in the module.

The local CSV workspace separates file selection and compact expandable format
help from a persistent, labelled results section below. Contextual links in the
input panel target this focusable results section after validation (including
errors); no automatic scroll interrupts file or format selection.

The data workspace prominently frames CSV preview as a simplified functionality
demonstration. A separate, explicitly prospective project section describes tailored
data integration, an integrated CFO dashboard and AI-supported analysis. Governance
features (roles, processing/provider choices, logging and human controls) are scoped
to the individual project; no certification or implemented production compliance is
claimed. The current demo's rule-based explanations and local-only preview remain
explicit. The project CTA links to the website contact section.

The “Was diese Demo zeigt” summary distinguishes finished interactive dashboard
views with fictional data, the separate simplified CSV preview, and the prospective
individual production project. It describes the dataset without implying that only
two months or a CSV dropzone represent the overall dashboard's scope.

The test CSV download sits directly above the local file dropzone, alongside
instructions to drop the downloaded file or supply a CSV with the same schema.
It is no longer a page-header action, keeping the sample and its use together.

## Expanded local CSV financial example

`csv.ts` owns column definitions, backward-compatible five-column validation and
the twelve-month downloadable fictional sample. Optional depreciation, net interest,
income tax, plans and closing balance fields are strictly parsed when present;
blank/missing stays null. Supplied known assets and equity/liabilities are checked
against supplied total assets. These are plausibility checks, not a full ledger audit.

`csv-analysis.ts` owns pure tested calculations and rule-based commentary for the
separate local preview. Period flows aggregate only with complete field coverage;
stock metrics always use the last selected month's closing balance, without
falling back to stale non-null values. Margins are computed from aggregate amounts.
Month comparisons require the immediately previous calendar month in the file.

`CsvAnalysis` presents Ertrag, Liquidität/Kapitalbindung, Kapitalstruktur, plan and
month comparisons, three separate-scale charts, and complete source/export tables.
Missing months/values break chart lines. No cashflow, aging, AI or cross-module data
import is implied. The always-visible format guide stretches level with the input
card on desktop; both stack naturally on mobile.

Navigation groups the local CSV analysis and assumptions page under “Demo selbst
ausprobieren”. The CSV route remains `/daten` with the visible label “CSV-Demo &
Auswertung”. All groups use the same shared navigation styles in both themes. Assumptions belong here
as the shared session-target playground; source/model disclosures remain there.

User design preference: no violet/purple anywhere. Navigation uses website red
accents; financial series use warm beige, taupe and gray with theme-specific values.
All four series tokens are updated centrally, including bar-chart categories.
Semantic positive/negative status colors stay separate from neutral chart series.

The demo group uses exactly the same caption, hover and active-link styles as the
other navigation groups. Separate demo color tokens and overrides were removed.

The import card's remaining height contains a short explanation of the four
analysis areas and three input-to-results steps. A successful import replaces
that orientation with actual validated month count/date range and a results link.
Errors retain the orientation and link to correction details; the local-only
processing and optional-data boundaries remain explicit.

## Compact CSV demo layout (current)

The CSV page now prioritizes an immediately visible three-step start (download or
load sample, drop/select file, inspect results). A single compact dropzone replaces
the equal-height columns and explanatory filler. Format/settings and all schema
fields are in a closed native details element. A one-line scope/local-processing
note and compact project CTA retain demo/production/AI distinctions.

Result categories are switched using labelled pressed-state buttons; all existing
metrics, controls and exports remain. Commentary, trends and source data open on
demand. File status announces validated month count/range. The irrelevant global
reporting-month selector and demo-ledger date context are hidden only on this local
CSV page, via default-preserving ModulePage options. Earlier expanded-layout notes
above describe superseded presentation; parsing and financial rules are unchanged.

Successful CSV validation now shows a persistent green, text-and-checkmark status
immediately below the dropzone with validated month count and a results link.
The success notice is absent while loading, after file removal, or for read/
validation errors; it also updates when delimiter/number-format validation changes.

## Complete guided tour (current)

`lib/tour.ts` defines all 14 unique dashboard routes in four navigation-aligned
chapters, with description, benefit, optional exercise, source note and highlight
target. Pure reducer tests cover route coverage, sequential/jump/back navigation,
visited deduplication, stop/resume/restart, honest partial completion and new sessions.

`DemoProvider` holds tour state independently from month/financial rules. A persistent
`TourLayout` observes explicit navigation, marks visits, and shows an in-flow sticky
rail on wide screens; at smaller widths it becomes a collapsed bottom strip with
reserved page space. No auto-navigation, forced exercises, popup sequence or auto-
scrolling. Only “Stelle anzeigen” scrolls/focuses the target; reduced motion respected.
The station list labels current/visited/open pages. Finishing early reports the
actual visited count and offers remaining pages. Header controls allow starting,
stopping and resuming; progress is memory-only until refresh. Financial inputs are
not reset by tour actions. Print hides all tour controls and highlight outlines.

Market tour copy describes external source status plus demo fallback rather than
promising working live data; the separately reviewed API/export defects remain
unmodified and still block the existing static website export.

## Individual dashboard offering and Swissi partnership

`/projekt` is a separate “Individuelle Lösung” navigation category and the fifteenth
tour stop (fifth chapter). The CSV page retains only a short link to this offering.
Shared contact CTAs link to it and identify the partnership; the project page has
its own contact actions and no fictional company reporting-date context.

The partnership is stated on the user's instruction. Public partner link:
https://swissi-ai.institute/de . The official operator name “Swissi Holding AG” was
verified at https://swissi-ai.institute/de/legal/imprint on 2026-10-23. No partner
logo was invented or copied. Typographic co-branding follows the dashboard tokens.

Privacy/compliance are described as project requirements implemented and checked
for the specific use case before production release: data minimization, access
roles, retention/deletion, hosting/provider/processing choices, contracts, evidence,
logs and human review. No blanket certification or already-running production AI
is claimed. Calculations remain deterministic; AI supports controlled interpretation.

## German and English presentation

The header DE/EN control updates all dashboard routes in place and remembers the
selection in local storage (`cfo-language`). Rendering starts in German on server
and during hydration, then restores the browser preference. A shared subscription
updates navigation, explanatory panels, the complete tour, project copy, page title
and document language without resetting period, scenarios, CSV results or notes.
The fixed English catalog lives in `dashboard/src/lib/i18n/en.ts`; no translation
service receives data. Dynamic narrative templates preserve computed values.
Formatting uses de-DE or en-GB with EUR unchanged. CSV templates use the parser's
existing English column aliases, and CSV decimal output follows the active locale.
User-written report notes remain verbatim. Internal financial IDs, source data and
filter values remain language-independent. Add catalog entries when adding UI copy.

## Expanded board pack

`report-analysis.ts` assembles numeric board evidence from the existing ledger,
monthly/YTD P&L, open invoices, session targets and independent cash assumptions.
`ReportAnalysis.tsx` displays the revenue/budget trend and monthly EBITDA margins,
additive EBITDA variance contributions, earnings-to-net-income reconciliation,
balance sheet uses/funding, historical cash waterfall and receivables ageing.
The forecast shows receipts/payments, the lowest month-end balance and headroom
against the session cash target; month-end coverage does not assert intra-month
liquidity. Risk and forecast toggles retain their scope; Executive Flash stays short.
The Board Pack print stylesheet starts analytical chapters on new A4 pages and
keeps figures together, using explicit warm neutral chart colors in both themes.
SVG and CSS charts remain vector graphics in browser-generated PDFs. Markdown
contains the underlying trend and variance evidence instead of chart images.
Financial tests reconcile cost contribution signs, YTD, ageing, balance funding,
historical cash and forecast continuity. Actual browser pagination still needs
visual verification when a browser connection is available.

The desktop board preview uses a relative frame with an absolutely positioned,
scrollable article, so only the editor determines the shared grid-row height.
The long report cannot add blank scroll space below the grid. On stacked layouts
the frame uses 75dvh. Print restores normal flow, unconstrained height and visible
overflow for both elements so all report pages are exported.

## Mobile code audit (browser verification pending)

The narrow header moves the tour launcher into the expandable navigation at
440px; launching it closes the menu. Coarse-pointer controls have larger touch
areas, and editable text controls use 16px to avoid iOS focus zoom. Metric panel
placement now respects the visual viewport (including its keyboard/pinch offsets)
and falls back to a bounded scrollable panel when a card fills a short screen.
Unit tests check portrait, landscape, keyboard-sized and desktop viewport bounds.
These are geometry and code checks; they do not replace Safari/Chrome rendering,
touch interaction, or device testing. Browser discovery currently returns no
connected browser; practical mobile verification remains pending.

All ten dropdown render sites use `components/ui/Select.tsx`: a native select in
a shared wrapper with a decorative CSS chevron inset 15px from the right. The
chevron ignores pointer events; keyboard and native mobile picker behavior are
preserved. Forced-colors mode restores the system arrow.

## ALL-INKL deployment and validated market adapters

The production demo is prepared for `/cfo-demo/` on the existing PHP webspace.
`build-demo.mjs` stages a copy of the app without Next server API routes, exports
all fifteen pages and adds the PHP market adapter. The build-time market URL is
base-path aware. A normal local Node deployment still uses `/api/market`.
`market-contract.ts` validates EUR FX values and dated ECB deposit observations;
`market-service.ts` bounds requests, preserves an unavailable ECB value as null
and never fabricates live FX. The PHP adapter uses the same response contract.
The deposit facility rate is a market indicator, not an automatic DCF input.
The website's existing FTPS workflow runs code/static/PHP HTTP checks before upload
and performs public HTTP checks afterwards. No account purchase or new hosting
subscription is part of this configuration. A language query parameter carries
the website's language into the app without sending source financial data.

## Website theme handoff

Website demo links carry the currently displayed `theme=light|dark` alongside
`lang`. The dashboard applies a valid theme before rendering, persists it under
the shared `theme` key when storage is available, and reapplies it after React hydration. Only then is the consumed theme
parameter removed without changing other query parameters or the hash. This prevents an
old entry URL from overriding later manual theme changes on reload. Without a
valid parameter, the saved preference and then the system preference apply.
