# Agent contracts v1.0

Runtime source: dashboard/src/lib/contracts.ts. Product prompts and UI import the
same definitions. These contracts exist now; the agent runtime is not implemented.

## Common success envelope

schema_version="1.0", request_id, company_id, agent, period={start,end}, currency
(uppercase ISO code), data_cutoff and generated_at (UTC ISO timestamps), sources,
assumptions, warnings. Market-only requests still use an authorized workspace scope;
company_id is scope metadata, not evidence that a company upload is required.

A source has id, label, kind (upload/engine/provider/demo), as_of. Evidence IDs in
metrics and alerts must resolve to these sources. Server code must additionally
verify that the evidence belongs to the authorized request and company, and that
returned numbers/statuses match the supplied immutable engine result.

## Metric

id, label, value (finite number or null), unit (currency/percent/percentage_points/
days/multiple/number/score), status (good/watch/warning/critical/neutral/unavailable),
comparison, target, unavailable_reason, evidence_ids.

A null value requires unavailable status, a reason, and comparison=null. A real zero
is valid and cannot use unavailable status. Percent 14.3 means 14.3%, not 0.143.
Comparison is null or {label, value, unit, direction, assessment}. Direction is
up/down/stable and matches the signed delta; assessment is improving/stable/
deteriorating/unknown and represents business meaning. Neither is inferred from status.
A missing comparison is not zero or a stable trend.

## Agent payloads

| agent | Additional required fields |
|---|---|
| orchestrator | intent, output_format, missing_inputs, steps[{id,agent,depends_on,input_refs}] |
| financial-analyst | analysis_type, metrics, findings, recommendations, sensitivity |
| kpi-monitor | metrics, alerts, summary |
| budget-planner | forecast_date, report_type, metrics, findings, scenarios[{name,metrics}] |
| market-data | observations[{symbol,metric,provider,as_of,fetched_at,cache_age_minutes,ttl_minutes,stale,peers}] |
| board-report | format, headline, markdown, upstream_request_ids |

Strict schemas reject unknown fields. DCF/IRR require rectangular sensitivity tables.
Orchestration steps are topologically ordered; IDs are unique; board-report is last
with upstream dependencies. Missing inputs mean no executable steps. Application code
must verify input_refs, execute only allowed tools and verify that all report inputs
are complete. Schema validation does not prove numerical correctness or authorization.

## Planned error boundary

The future API should return a non-success HTTP status and an envelope with
schema_version, request_id and error={code,message,retryable,missing_inputs}.
Codes: missing_data, invalid_data, invalid_agent_output, provider_unavailable,
engine_unavailable, timeout. Do not render failed outputs as successful metrics.
Validate both engine results and agent responses before consumption; use bounded
retries and preserve validated partial results only with explicit warnings.
