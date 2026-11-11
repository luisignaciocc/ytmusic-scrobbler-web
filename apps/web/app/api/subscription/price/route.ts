import { NextResponse } from "next/server";

import { getProPriceId, getStripe } from "@/lib/billing/provider";

export const runtime = "nodejs";
export const revalidate = 3600;

/** Display price of the Pro plan, read from Stripe so it is never hardcoded. */
export async function GET() {
  try {
    const price = await getStripe().prices.retrieve(await getProPriceId());
    if (price.unit_amount === null) {
      throw new Error("Stripe price has no fixed amount");
    }
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currency,
    }).format(price.unit_amount / 100);
    return NextResponse.json({ formatted });
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}
