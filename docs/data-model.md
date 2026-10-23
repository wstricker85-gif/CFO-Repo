# Canonical data specification — importer not implemented

Each dataset carries company_id, ISO currency, period_start, period_end, as_of,
source_id and scenario (actual/budget/forecast). Monetary amounts are decimal currency
amounts. Reject mixed currencies without explicit dated FX conversion. Dates are ISO.

| Dataset | Required fields beyond metadata | Enables |
|---|---|---|
| P&L | account, category, amount, sign convention | Revenue, COGS, EBITDA, EBIT, margins |
| Balance sheet | account, category, closing_balance | Cash, AR/AP, inventory, debt, equity, assets, liquidity ratios |
| Receivables | invoice_id, customer_id, invoice_date, due_date, outstanding_amount, snapshot_date | Aging, concentration, collections |
| Payables | invoice_id, supplier_id, due_date, outstanding_amount, snapshot_date | Payment planning |
| Budget | account, category, amount, period, cost_behavior | Variances, scenarios |
| Cash movements | date, amount, flow_category, scenario | Cash reconciliation |
| Workforce | period, headcount_fte, personnel_cost | Revenue/FTE, salary ratio |
| Investment inputs | dated cashflows, capex, taxes, working_capital_changes, WACC, terminal_growth, hurdle_rate | DCF, NPV, IRR |

Map German/English aliases explicitly; never guess ambiguous Betrag columns. Keep
stock values (at a date) distinct from flows (over a period). Reject duplicates,
invalid dates, missing periods and inconsistent accounting signs. Do not silently
aggregate companies, currencies or scenarios.

## Financial conventions for the future engine

- DSO = average trade AR / credit sales × period days. DIO = average inventory /
  COGS × period days. DPO = average trade AP / purchases × period days. Closing
  balances, all sales or COGS as proxies require warnings. Never hardcode 30 days
  for annual/quarterly data. Document actual/360 conventions.
- Zero denominators produce unavailable values and a reason, never 0 or Infinity.
- Margin changes use percentage points; revenue growth uses relative percentages.
- DCF needs explicit FCF drivers and WACC > terminal growth. Fixed EBITDA-to-FCF
  factors are labelled rough scenarios, never the default valuation method.
- DCF/NPV sensitivity varies growth and discount rate. IRR sensitivity varies cashflow
  drivers/timing; changing discount rate alone does not change IRR. Flag absent/multiple
  roots. A synthetic internal score is never a bank/agency credit rating.
- Thresholds are versioned company/industry inputs. Engine outputs include classification
  and trends. At least two comparable periods are needed for trends, six historical
  points for anomaly detection with a documented method.
- Forecasts lock actual periods, separate committed/variable flows, state data cutoff
  and forecast date and reconcile opening + net movement = closing cash.
