import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { getProPriceId, getStripe } from "@/lib/billing/provider";
import { hasLiveSubscription } from "@/lib/support/guards";

export const runtime = "nodejs";

const prisma = new PrismaClient();

/** Creates a Stripe Checkout session for the Pro plan and returns its URL. */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Covers subscriptions still billed by Paddle too: without this a Paddle
    // subscriber could start a second, parallel subscription on Stripe.
    if (hasLiveSubscription(user)) {
      return NextResponse.json(
        { error: "You already have an active subscription." },
        { status: 409 },
      );
    }

    const origin = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
    const checkout = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: await getProPriceId(), quantity: 1 }],
      client_reference_id: user.id,
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : { customer_email: user.email }),
      // The webhook finds the user through this, whatever email they pay with.
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${origin}/pricing?checkout=success`,
      cancel_url: `${origin}/pricing`,
      ...(process.env.STRIPE_MANAGED_PAYMENTS === "true"
        ? { managed_payments: { enabled: true } }
        : {}),
    });

    if (!checkout.url) throw new Error("Stripe returned no checkout URL");
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 },
    );
  }
}
