# CFO-Repo — Claude Project Instructions

## Project Overview

A multi-agent AI system for CFOs and financial leaders. Provides financial analysis, KPI monitoring, board-ready reports, and budget planning through a Next.js dashboard with a design aligned to stricker-capital.de.

**Target users:** CFOs, interim managers, financial controllers
**Demo:** Embeddable as an iframe on stricker-capital.de

---

## Architecture

```
CFO-Repo/
├── CLAUDE.md               ← You are here. Read this first.
├── .claude/
│   ├── settings.json       ← Project permissions
│   └── skills/             ← Project-specific Claude skills
├── agents/
│   ├── orchestrator.md     ← Routes tasks to specialist agents
│   ├── financial-analyst.md
│   ├── kpi-monitor.md
│   ├── board-report.md
│   ├── budget-planner.md
│   └── market-data.md
├── dashboard/              ← Next.js app (TypeScript + Tailwind)
│   └── src/
│       ├── app/            ← App Router pages
│       ├── components/     ← UI components
│       └── lib/            ← Agent API calls, data utils
├── data/
│   ├── uploads/            ← User-uploaded CSV/Excel files
│   └── market-cache/       ← Cached API responses
├── templates/              ← Board report / KPI templates
└── docs/                   ← Architecture decisions, API docs
```

---

## Agent System

### Orchestrator
The orchestrator is the entry point for all user requests. It reads the user's intent and delegates to the correct specialist agent. It NEVER performs analysis itself — it routes and assembles final output.

**Routing logic:**
- Financial ratios, DCF, valuation → `financial-analyst`
- KPI trends, alerts, metrics → `kpi-monitor`
- Board presentations, executive summaries → `board-report`
- Budget vs. actual, forecasts → `budget-planner`
- Market prices, benchmarks, indices → `market-data`

### Specialist Agents

| Agent | Responsibility | Data Sources |
|-------|---------------|--------------|
| `financial-analyst` | DCF, ratio analysis, P&L interpretation | CSV uploads, Excel |
| `kpi-monitor` | KPI tracking, trend detection, alerts | CSV uploads, APIs |
| `board-report` | Executive summaries, narrative generation | Output from other agents |
| `budget-planner` | Budget vs. actual, variance analysis, forecasts | CSV uploads |
| `market-data` | Stock prices, indices, benchmarks | Yahoo Finance, Alpha Vantage APIs |

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + custom design tokens (see Design System below)
- **Charts:** Recharts (to be installed)
- **AI:** Anthropic Claude API (claude-sonnet-4-6 for analysis, claude-haiku-4-5 for routing)
- **Data:** CSV/Excel parsing via `papaparse`, market data via API calls

---

## Design System

Derived from stricker-capital.de. Apply these tokens in all components.

```css
/* Dark theme (default) */
--bg:      #111113
--panel:   #19191c
--ink:     #f1eee8
--muted:   #aaa7a2
--line:    #343438
--accent:  #d74731
--accent-soft: #e4836f

/* Light theme */
--bg:      #f3f0e9
--panel:   #ffffff
--ink:     #171719
--muted:   #625f5a
--line:    #d2cbc0
--accent:  #c83f2d
```

**Fonts:** Georgia (headings) · Inter (body) · SFMono (labels/meta)
**Max-width:** 1180px
**Style:** Clean, minimal, no rounded corners, high contrast

---

## Development Commands

```bash
# Start dashboard dev server
cd dashboard && npm run dev

# Build for production
cd dashboard && npm run build

# Type check
cd dashboard && npx tsc --noEmit

# Lint
cd dashboard && npm run lint
```

---

## Coding Conventions

- All components in `dashboard/src/components/` — one file per component
- API routes in `dashboard/src/app/api/` — one route per agent
- Agent definitions in `agents/` — Markdown files, not code
- Never hardcode API keys — use `.env.local` (never commit this file)
- Prefer server components; use `'use client'` only when needed (charts, forms)
- German comments are fine for business logic; English for code

---

## Environment Variables

```
ANTHROPIC_API_KEY=        ← Claude API
ALPHA_VANTAGE_API_KEY=    ← Market data
```

Store in `dashboard/.env.local` — this file is in .gitignore.

---

## Current Status

- [x] Repo initialized
- [x] Next.js scaffold created
- [x] Project structure defined
- [ ] Design tokens applied to Tailwind config
- [ ] Agent definitions written
- [ ] API routes connected to Claude
- [ ] Dashboard components built
- [ ] Demo embed tested on website
