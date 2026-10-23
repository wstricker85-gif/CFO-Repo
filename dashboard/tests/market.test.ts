import test from "node:test";
import assert from "node:assert/strict";
import {
  frankfurterSchema,
  liveMarketSchema,
  parseEcbDeposit,
} from "../src/lib/market-contract.ts";
import { loadMarket, FX_URL, ECB_URL } from "../src/lib/market-service.ts";
const fx = {
  base: "EUR",
  date: "2026-10-22",
  rates: { USD: 1.12, CHF: 0.92, GBP: 0.84, PLN: 4.36 },
};
const ecb = {
  dataSets: [{ series: { only: { observations: { "0": [2.5], "1": [0] } } } }],
  structure: {
    dimensions: {
      observation: [{ id: "TIME_PERIOD", values: [{ id: "2026-10-22" }, { id: "2026-10-23" }] }],
    },
  },
};
function mockFetch(fxData: unknown = fx, ecbData: unknown = ecb): typeof fetch {
  return (async (input, init) => {
    assert.ok(init?.signal instanceof AbortSignal);
    assert.ok([FX_URL, ECB_URL].includes(String(input)));
    return new Response(JSON.stringify(String(input) === FX_URL ? fxData : ecbData), {
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}
test("market sources reject missing, zero, non-finite and wrong-currency FX data", () => {
  for (const data of [
    { ...fx, base: "USD" },
    { ...fx, date: "2026-02-30" },
    { ...fx, rates: { ...fx.rates, USD: 0 } },
    { ...fx, rates: { ...fx.rates, USD: "1.12" } },
    { ...fx, rates: { ...fx.rates, PLN: null } },
  ])
    assert.equal(frankfurterSchema.safeParse(data).success, false);
});
test("ECB observations use dated positions and preserve a valid zero interest rate", () => {
  assert.deepEqual(parseEcbDeposit(ecb), { ecbRate: 0, ecbAsOf: "2026-10-23" });
  const negative = structuredClone(ecb);
  negative.dataSets[0].series.only.observations["1"] = [-0.5];
  assert.equal(parseEcbDeposit(negative).ecbRate, -0.5);
  assert.throws(() => parseEcbDeposit({}));
});
test("market adapter returns only validated EUR rates and independent ECB dates", async () => {
  const data = await loadMarket(mockFetch());
  assert.equal(data.rates.EUR, 1);
  assert.equal(data.rates.USD, 1.12);
  assert.equal(data.asOf, "2026-10-22");
  assert.equal(data.ecbAsOf, "2026-10-23");
  assert.equal(data.ecbRate, 0);
  assert.equal(liveMarketSchema.safeParse(data).success, true);
  assert.equal(liveMarketSchema.safeParse({ ...data, ecbRate: null }).success, false);
});
test("ECB failure retains validated FX while marking the interest rate unavailable", async () => {
  const data = await loadMarket(mockFetch(fx, {}));
  assert.equal(data.ecbRate, null);
  assert.equal(data.ecbAsOf, null);
  assert.equal(data.rates.USD, fx.rates.USD);
});
test("FX failure never produces invented live numbers", async () => {
  await assert.rejects(() => loadMarket(mockFetch({})));
  await assert.rejects(() =>
    loadMarket((async () => {
      throw new Error("Timeout");
    }) as typeof fetch),
  );
});
