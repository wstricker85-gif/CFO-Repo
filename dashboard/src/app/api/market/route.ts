import { NextResponse } from "next/server";
import { loadMarket } from "@/lib/market-service";

export async function GET() {
  try {
    return NextResponse.json(await loadMarket(), {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json(
      { error: "Marktdaten momentan nicht verfügbar." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store", "Retry-After": "60" },
      },
    );
  }
}
