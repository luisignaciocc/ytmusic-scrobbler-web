import { NextResponse } from "next/server";

import { getProPriceId, getStripe } from "@/lib/billing/provider";

export const runtime = "nodejs";
// Never prerendered: the app is built on a CI runner that has no Stripe key,
// and a response generated there would be an error cached into the build.
export const dynamic = "force-dynamic";

const CACHE_MS = 60 * 60 * 1000;
let cached: { formatted: string; at: number } | null = null;

/** Display price of the Pro plan, read from Stripe so it is never hardcoded. */
export async function GET() {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return NextResponse.json({ formatted: cached.formatted });
  }
  try {
    const price = await getStripe().prices.retrieve(await getProPriceId());
    if (price.unit_amount === null) {
      throw new Error("Stripe price has no fixed amount");
    }
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currency,
    }).format(price.unit_amount / 100);
    cached = { formatted, at: Date.now() };
    return NextResponse.json({ formatted });
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}
