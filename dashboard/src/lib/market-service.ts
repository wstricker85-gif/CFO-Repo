import { frankfurterSchema, liveMarketSchema, parseEcbDeposit } from "./market-contract.ts";

export const FX_URL =
  "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,CHF,GBP,PLN&providers=ECB";
export const ECB_URL =
  "https://data-api.ecb.europa.eu/service/data/FM/D.U2.EUR.4F.KR.DFR.LEV?lastNObservations=1&format=jsondata";

/** Only fixed public endpoints are fetched; no visitor-controlled URLs or data. */
export async function loadMarket(fetcher: typeof fetch = fetch) {
  const read = async (url: string): Promise<unknown> => {
    const response = await fetcher(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    } as RequestInit);
    if (!response.ok) throw new Error("Market source unavailable");
    return response.json();
  };
  const [fxResult, ecbResult] = await Promise.allSettled([
    read(FX_URL).then((data) => frankfurterSchema.parse(data)),
    read(ECB_URL).then(parseEcbDeposit),
  ]);
  if (fxResult.status !== "fulfilled") throw new Error("FX source unavailable or invalid");
  const fx = fxResult.value;
  return liveMarketSchema.parse({
    rates: { EUR: 1, ...fx.rates },
    ...(ecbResult.status === "fulfilled" ? ecbResult.value : { ecbRate: null, ecbAsOf: null }),
    asOf: fx.date,
    source: "Frankfurter.dev · EZB-Referenzkurse",
    fetchedAt: new Date().toISOString(),
  });
}
