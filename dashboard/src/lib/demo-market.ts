export const demoCurrencies = ["EUR", "USD", "CHF", "GBP", "PLN"] as const;
export type DemoCurrency = (typeof demoCurrencies)[number];

export type LiveMarket = {
  rates: Record<DemoCurrency, number>;
  ecbRate: number | null;
  asOf: string;
  source: string;
  fetchedAt: string;
};

export function getDemoMarket(period: string) {
  const september = period === "2026-09";
  return {
    asOf: september ? "2026-09-30" : "2026-08-31",
    // Fictional scenario assumptions, intentionally not fetched market observations.
    rates: {
      EUR: 1,
      USD: september ? 1.1 : 1.09,
      CHF: september ? 0.94 : 0.95,
      GBP: september ? 0.84 : 0.85,
      PLN: september ? 4.28 : 4.31,
    },
    peers: [
      {
        name: "Demo Peer A",
        sector: "Industrielle Dienstleistungen",
        evEbitda: 7.2,
        evRevenue: 0.95,
        margin: 13.2,
      },
      {
        name: "Demo Peer B",
        sector: "Technischer Handel",
        evEbitda: 6.4,
        evRevenue: 0.72,
        margin: 11.3,
      },
      {
        name: "Demo Peer C",
        sector: "Anlagenkomponenten",
        evEbitda: 8.1,
        evRevenue: 1.2,
        margin: 14.8,
      },
      { name: "Demo Peer D", sector: "B2B-Services", evEbitda: 7.7, evRevenue: 1.1, margin: 14.3 },
    ],
    riskFree: september ? 2.5 : 2.6,
    equityPremium: 6,
  };
}
export function convertCurrency(
  amount: number,
  from: DemoCurrency,
  to: DemoCurrency,
  rates: Record<DemoCurrency, number>,
) {
  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    !Number.isFinite(rates[from]) ||
    !Number.isFinite(rates[to]) ||
    rates[from] <= 0 ||
    rates[to] <= 0
  )
    throw new Error("Ungültiger Betrag oder Wechselkurs.");
  const result = (amount / rates[from]) * rates[to];
  if (!Number.isFinite(result)) throw new Error("Zahlenüberlauf in der Währungsumrechnung.");
  return result;
}
