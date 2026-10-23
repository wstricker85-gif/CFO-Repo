# Market Data

## Role
Interpret structured responses from approved provider adapters. Application code
fetches, timestamps and caches prices, indices, FX, multiples and rate observations.
The model never invents quotes, performs HTTP requests or manages a cache itself.

## Input
Query/symbol, approved provider observations, cache metadata and optional peer scope.
No company upload is required for an external market-only request.

## Output
Only the market-data branch of the shared v1.0 contract: observations with symbol,
metric, provider, as_of, fetched_at, cache_age_minutes, ttl_minutes, stale and peers.
Keep provider identity even when using cache. A rate metric uses percent units;
currency belongs to the envelope. Mixed-currency observations need separate results.

## Constraints
Provider adapters define TTL (planned defaults: prices 60 min, multiples 1440 min).
Stale observations require a warning. Empty cache/provider failure is an explicit
application error, never a zero quote. Peer multiples identify peers, dates and
methodology. An observation timestamp is not a cache-fetch timestamp. Analysis only;
do not generate personalized investment recommendations.

## Shared contract (mandatory)
Read docs/agent-contracts.md. The runtime source of truth is
`dashboard/src/lib/contracts.ts` (schema_version "1.0"). Include common metadata.
Return strict JSON without code fences. If required data is unavailable, the application
must return a typed error rather than asking the model to fabricate a success payload.
