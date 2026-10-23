import { NextResponse } from "next/server";

type FrankfurterResponse = {
  date: string;
  base: string;
  rates: Record<string, number>;
};

async function fetchEcbDepositRate(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.RT0.BB.R.1.E.Z.E.Q?lastNObservations=1&format=jsondata",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const series = Object.values(
      (data?.dataSets?.[0]?.series ?? {}) as Record<
        string,
        { observations?: Record<string, number[]> }
      >,
    )[0];
    const last = Object.values(series?.observations ?? {}).at(-1);
    return typeof last?.[0] === "number" ? last[0] : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD,CHF,GBP,PLN", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
    const fx: FrankfurterResponse = await res.json();

    const ecbRate = await fetchEcbDepositRate();

    return NextResponse.json({
      rates: {
        EUR: 1,
        USD: fx.rates.USD,
        CHF: fx.rates.CHF,
        GBP: fx.rates.GBP,
        PLN: fx.rates.PLN,
      },
      ecbRate,
      asOf: fx.date,
      source: "Frankfurter.app · EZB-Referenzkurse",
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Marktdaten momentan nicht verfügbar." }, { status: 503 });
  }
}
