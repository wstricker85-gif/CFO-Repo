import { liveMarketSchema } from "../src/lib/market-contract.ts";
const url = process.argv[2];
if (!url) throw new Error("Provide the market adapter HTTP URL");
const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`Market adapter HTTP ${response.status}`);
const data = liveMarketSchema.parse(await response.json());
const post = await fetch(url, { method: "POST", signal: AbortSignal.timeout(5000) });
if (post.status !== 405) throw new Error("Market adapter must reject POST");
console.log(
  `Market adapter checked: FX ${data.asOf}; ECB ${data.ecbAsOf ?? "unavailable (labelled fallback)"}; POST rejected.`,
);
