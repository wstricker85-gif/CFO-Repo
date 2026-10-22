# CFO-Repo — Claude Project Instructions

## What this project is

A multi-agent AI system for CFOs and financial leaders. It combines uploaded financial data
(CSV/Excel) with live market data to deliver analysis, KPI monitoring, board-ready reports,
and budget planning — through a Next.js dashboard that can be embedded on stricker-capital.de.

**Target users:** CFOs, interim managers, financial controllers
**Languages:** German UI, English code

---

## Architecture overview

```
CFO-Repo/
├── CLAUDE.md                  ← Read this first. Always.
├── .claude/
│   ├── settings.json          ← Project-level permissions
│   └── skills/                ← Reusable Claude skills for this project
├── agents/                    ← One Markdown file per agent (= system prompt + contract)
│   ├── orchestrator.md
│   ├── financial-analyst.md
│   ├── kpi-monitor.md
│   ├── board-report.md
│   ├── budget-planner.md
│   └── market-data.md
├── backend/                   ← Python / FastAPI (financial calculation engine)
│   ├── agents/                ← Python agent classes
│   ├── scripts/               ← Pure calculation modules (no AI, just math)
│   └── main.py                ← FastAPI app, routes
├── dashboard/                 ← Next.js app (TypeScript + Tailwind)
│   └── src/
│       ├── app/               ← Pages (App Router) + API routes
│       ├── components/        ← UI building blocks
│       └── lib/               ← Data fetching, type definitions, utilities
├── data/
│   ├── uploads/               ← User-uploaded CSV/Excel files (gitignored)
│   └── market-cache/          ← API response cache (gitignored)
├── templates/                 ← Report and KPI templates
└── docs/                      ← Architecture decisions, formula documentation
```

---

## Two-layer backend

This project has a deliberate split:

**Layer 1 — Calculation Engine (Python/FastAPI in `backend/`)**
Pure financial math. No AI. Takes structured data, returns structured results.
Fast, deterministic, testable. This is where DSO, DCF, WACC etc. live.

**Layer 2 — Intelligence Layer (Claude API, called from Next.js API routes)**
Interprets the numbers, writes narratives, routes requests, flags risks.
Non-deterministic. Uses agent definitions from `agents/*.md` as system prompts.

The two layers communicate via HTTP: Next.js calls FastAPI for numbers,
then calls Claude for interpretation.

---

## Agent system

### How agents work in this project
Each file in `agents/` is a Markdown document that defines one agent's:
- **Role** — what it is and what it does
- **Capabilities** — what analysis it can perform
- **Input contract** — what data it expects
- **Output contract** — exactly what JSON structure it returns
- **Constraints** — what it must never do

When a user sends a request, the Orchestrator reads it, picks the right agent(s),
passes the relevant data + the agent's Markdown as a system prompt to Claude,
and assembles the final response.

### Agent roster

| Agent | When to call | Key output |
|-------|-------------|-----------|
| `financial-analyst` | DCF, IRR, ratios, WC, sensitivity | Metrics JSON + interpretation |
| `kpi-monitor` | KPI status, trend, RAG rating, alerts | KPI array with status |
| `board-report` | Executive summaries, CFO commentary | Structured Markdown narrative |
| `budget-planner` | Variance analysis, rolling forecast | Variance table + forecast |
| `market-data` | Prices, indices, peer multiples | Cached market data |

### Orchestration rule
For simple requests → call one agent.
For complex requests → call multiple agents in parallel, then call `board-report` to synthesize.
The orchestrator never does analysis itself.

---

## Financial concepts this project implements

Document each formula in `docs/` when you build it. Short reference here:

### Working Capital
- **DSO** (Days Sales Outstanding) = receivables / (revenue / 30)
  Measures: how long customers take to pay. Lower = better.
- **DIO** (Days Inventory Outstanding) = inventory / (COGS / 30)
  Measures: how long inventory sits. Lower = better.
- **DPO** (Days Payable Outstanding) = payables / (COGS / 30)
  Measures: how long we take to pay suppliers. Higher = better (up to a point).
- **CCC** (Cash Conversion Cycle) = DSO + DIO − DPO
  Measures: days cash is tied up in operations. Lower = better.
- **NWC** (Net Working Capital) = receivables + inventory − payables

### Valuation
- **DCF**: Project free cash flows for 5 years, discount at WACC, add terminal value.
  Terminal value = FCF₅ × (1 + g) / (WACC − g) — Gordon Growth Model
- **WACC**: Weighted average cost of capital = (E/V × Ke) + (D/V × Kd × (1−t))
- **IRR**: The discount rate at which NPV = 0. Compare to hurdle rate.
- **MOIC**: Total value returned / total invested. Used in PE context.
- **Ertragswertverfahren** (IDW S1): sustainable earnings / capitalisation rate
  German standard. Often averaged with DCF for SME valuations.

### Profitability Ratios
- Gross margin = (Revenue − COGS) / Revenue
- EBITDA margin = EBITDA / Revenue
- EBIT margin = EBIT / Revenue
- Thresholds (SME context): EBITDA <5% = warning, <0% = critical

### Leverage & Credit
- Debt/Equity ratio = total debt / equity
- Net debt/EBITDA = (debt − cash) / EBITDA. >4× = elevated risk.
- Interest coverage = EBIT / interest expense. <2× = warning.
- Equity ratio = equity / total assets. <20% = critical for bank ratings.

### Cashflow Forecast
- Cash in = invoice amounts shifted by (payment_terms_days + actual_delay_days)
- Cash out = payables in the month they are due
- Cumulative liquidity = starting balance + cumulative net cashflow
- Warning: any month where cumulative liquidity < threshold (configurable)

### Tax (Germany)
- Körperschaftsteuer (KSt): 15% of taxable income + 5.5% Solidaritätszuschlag
- Gewerbesteuer (GewSt): 3.5% × Hebesatz (default 400%) of taxable income
- Effective combined rate ≈ 30% in most German municipalities

### Sensitivity Analysis
Always pair DCF and IRR outputs with a 2D sensitivity table:
rows = revenue growth assumptions, columns = WACC/discount rate assumptions.
This is not optional — single-point valuations mislead.

---

## Data model (CSV uploads)

Users upload CSVs. Support German and English column names.

| File type | Required columns |
|-----------|-----------------|
| `revenue` | month, customer, invoice_amount |
| `payables` | month, supplier_category, payment_amount |
| `receivables` | invoice_date, due_date, customer, amount, payment_terms_days, actual_delay_days |
| `inventory` | month, inventory_value |
| `financing` | item (eigenkapital/fremdkapital/zinsen/hebesatz), value |
| `budget` | month, category, budget_amount, actual_amount |

German aliases to support: Monat, Kunde, Betrag, Fälligkeitsdatum, Zahlungsziel, Lagerbestand, etc.

---

## Design system

Extracted from stricker-capital.de. Use these tokens everywhere.
Never hardcode colors — always reference CSS variables.

```css
/* Dark theme (default) */
--bg:           #111113
--panel:        #19191c
--ink:          #f1eee8
--muted:        #aaa7a2
--line:         #343438
--accent:       #d74731    /* primary brand red-orange */
--accent-soft:  #e4836f

/* Light theme (data-theme="light") */
--bg:           #f3f0e9
--panel:        #ffffff
--ink:          #171719
--muted:        #625f5a
--line:         #d2cbc0
--accent:       #c83f2d
```

### Color taxonomy — 4 strict layers, never mix them

| Layer | Purpose | Colors |
|-------|---------|--------|
| Brand | Logo, active nav, highlights only | `--accent`, `--accent-soft` |
| Status | RAG ratings, KPI tones, thresholds | green `#22c55e` / amber `#f59e0b` / red `#ef4444` |
| Flow | Paired in/out series (revenue vs. cost) | in = green / out = red |
| Series | Multi-line charts, categorical data | blue / purple / cyan / orange / pink |

**Rule:** Never use brand accent on data. Never use status colors for decoration.

### Typography
- **Headings (h1):** Georgia, 500 weight, tight letter-spacing (−0.03em)
- **Body:** Inter, 15–17px, line-height 1.65
- **Labels/meta:** SFMono, 9–11px, uppercase, letter-spacing +0.08em
- **Numbers in tables/cards:** Inter + `font-variant-numeric: tabular-nums`

### Layout
- Max-width: 1180px (`--wrap`)
- Card padding: 20px
- Grid gap: 12px (cards), 24px (sections)
- No border-radius on cards (matches website)
- Borders: 1px solid `--line`

---

## Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 15, App Router | SSR + client interactivity, embeddable |
| Styling | Tailwind CSS + CSS variables | Utility-first + design tokens |
| Charts | Recharts | React-native, composable, good TypeScript support |
| AI | Anthropic Claude API | claude-sonnet-4-6 for analysis, claude-haiku-4-5 for routing |
| Backend | Python 3.12 + FastAPI | Pandas for data processing, clean financial math |
| Data parsing | papaparse (JS), pandas (Python) | Best-in-class CSV handling |
| Market data | Yahoo Finance (free) + Alpha Vantage (API key) | Prices, multiples, indices |

---

## Coding conventions

- **Components:** `dashboard/src/components/<Category>/<ComponentName>.tsx`
- **Pages:** `dashboard/src/app/<route>/page.tsx`
- **API routes:** `dashboard/src/app/api/<name>/route.ts`
- **Backend modules:** `backend/scripts/<topic>.py` (pure math, no FastAPI)
- **No hardcoded API keys** — always `.env.local`, never committed
- **Prefer server components** — `'use client'` only for charts, forms, interactive state
- **One responsibility per file** — a file that does two things should be two files
- **Document financial formulas** in `docs/` when first implemented

---

## Commands

```bash
# Frontend
cd dashboard && npm run dev       # dev server on :3000
cd dashboard && npm run build     # production build
cd dashboard && npx tsc --noEmit  # type check

# Backend (once set up)
cd backend && uvicorn main:app --reload --port 8000

# Both at once (once start script exists)
bash start.sh
```

---

## Environment variables

```bash
# dashboard/.env.local
ANTHROPIC_API_KEY=
ALPHA_VANTAGE_API_KEY=
BACKEND_URL=http://localhost:8000
```

---

## Build status

- [x] GitHub repo connected
- [x] Next.js scaffold
- [x] Project structure
- [x] CLAUDE.md (this file)
- [x] Agent definitions (all 6)
- [ ] Tailwind design tokens configured
- [ ] Backend scaffold (FastAPI)
- [ ] First component: KpiCard
- [ ] First page: Dashboard overview
- [ ] First API route: /api/orchestrator
- [ ] CSV upload + parsing
- [ ] Financial calculation modules
- [ ] Claude API integration
- [ ] Market data integration
- [ ] Auth
- [ ] Demo embed on website
