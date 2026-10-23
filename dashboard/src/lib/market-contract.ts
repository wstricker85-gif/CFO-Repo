import { z } from "zod";

export const marketCurrencies = ["EUR", "USD", "CHF", "GBP", "PLN"] as const;
const rate = z.number().finite().positive();
export const frankfurterSchema = z.object({
  base: z.literal("EUR"),
  date: z.iso.date(),
  rates: z.object({ USD: rate, CHF: rate, GBP: rate, PLN: rate }),
});
export const liveMarketSchema = z
  .object({
    rates: z.object({ EUR: z.literal(1), USD: rate, CHF: rate, GBP: rate, PLN: rate }),
    ecbRate: z.number().finite().min(-100).max(100).nullable(),
    ecbAsOf: z.iso.date().nullable(),
    asOf: z.iso.date(),
    source: z.string().min(1),
    fetchedAt: z.iso.datetime(),
  })
  .refine(
    (d) => (d.ecbRate === null) === (d.ecbAsOf === null),
    "ECB value and date must be available together",
  );
export type LiveMarket = z.infer<typeof liveMarketSchema>;

const ecbSchema = z.object({
  dataSets: z
    .array(
      z.object({
        series: z.record(
          z.string(),
          z.object({ observations: z.record(z.string(), z.array(z.unknown())) }),
        ),
      }),
    )
    .min(1),
  structure: z.object({
    dimensions: z.object({
      observation: z.array(
        z.object({ id: z.string(), values: z.array(z.object({ id: z.string() })) }),
      ),
    }),
  }),
});
export function parseEcbDeposit(data: unknown) {
  const parsed = ecbSchema.parse(data);
  const series = Object.values(parsed.dataSets[0].series);
  if (series.length !== 1) throw new Error("Expected one ECB deposit facility series");
  const time = parsed.structure.dimensions.observation.find((d) => d.id === "TIME_PERIOD");
  if (!time) throw new Error("Missing ECB observation date");
  const entries = Object.entries(series[0].observations)
    .map(([index, values]) => ({
      date: z.iso.date().parse(time.values[Number(index)]?.id),
      value: z.number().finite().min(-100).max(100).parse(values[0]),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) throw new Error("Missing ECB observation");
  return { ecbRate: entries[0].value, ecbAsOf: entries[0].date };
}
