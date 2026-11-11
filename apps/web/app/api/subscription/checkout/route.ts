import { PrismaClient, User } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type Stripe from "stripe";

import { getProPriceId, getStripe } from "@/lib/billing/provider";
import { hasLiveSubscription } from "@/lib/support/guards";

export const runtime = "nodejs";

const prisma = new PrismaClient();

/** Subscription statuses after which Stripe will never bill again. */
const ENDED_IN_STRIPE = ["canceled", "incomplete_expired"];

/**
 * Every user gets exactly one Stripe customer, created before their first
 * checkout, so that their subscriptions and pending checkouts can be looked
 * up in Stripe. The idempotency key makes concurrent calls share it.
 */
async function ensureStripeCustomer(stripe: Stripe, user: User) {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe.customers.create(
    { email: user.email, name: user.name, metadata: { userId: user.id } },
    { idempotencyKey: `customer:${user.id}` },
  );
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

/**
 * Returns the URL of the user's Stripe Checkout session for the Pro plan,
 * creating one only when none is pending.
 */
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

    const stripe = getStripe();
    const customerId = await ensureStripeCustomer(stripe, user);

    // Stripe is the source of truth here: a subscription paid a moment ago
    // may not have reached our database through the webhook yet.
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
    });
    if (subscriptions.data.some((s) => !ENDED_IN_STRIPE.includes(s.status))) {
      return NextResponse.json(
        { error: "You already have an active subscription." },
        { status: 409 },
      );
    }

    // One pending checkout per user: paying two separate sessions would
    // start two subscriptions, and only one of them can be tracked.
    const pending = await stripe.checkout.sessions.list({
      customer: customerId,
      status: "open",
      limit: 1,
    });
    if (pending.data[0]?.url) {
      return NextResponse.json({ url: pending.data[0].url });
    }

    const origin = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
    const checkout = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        line_items: [{ price: await getProPriceId(), quantity: 1 }],
        client_reference_id: user.id,
        customer: customerId,
        // The webhook finds the user through this, whatever email they pay with.
        subscription_data: { metadata: { userId: user.id } },
        success_url: `${origin}/pricing?checkout=success`,
        cancel_url: `${origin}/pricing`,
        ...(process.env.STRIPE_MANAGED_PAYMENTS === "true"
          ? { managed_payments: { enabled: true } }
          : {}),
      },
      // Simultaneous requests (double click, two tabs) get the same session.
      {
        idempotencyKey: `checkout:${user.id}:${Math.floor(Date.now() / 60_000)}`,
      },
    );

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
