/* eslint-disable no-console */
import { PrismaClient, User } from "@prisma/client";
import { NextRequest } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/billing/provider";
import {
  shouldApplyStripeSubscription,
  stripeSubscriptionToColumns,
} from "@/lib/billing/subscription-state";

export const runtime = "nodejs";

const prisma = new PrismaClient();

/**
 * Finds the account a Stripe subscription belongs to. Checkout stamps the
 * user id on the subscription; the other lookups cover subscriptions created
 * outside our checkout (e.g. imported from Paddle), which only share the
 * customer's email with us.
 */
async function findUser(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  customerId: string,
): Promise<User | null> {
  const userId = subscription.metadata?.userId;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;
  }

  const known = await prisma.user.findFirst({
    where: {
      OR: [{ stripeCustomerId: customerId }, { subscriptionId: subscription.id }],
    },
  });
  if (known) return known;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !customer.email) return null;
  return prisma.user.findUnique({ where: { email: customer.email } });
}

/**
 * Stripe does not deliver events in order, so the event only tells us which
 * subscription changed; the state we store is always re-read from the API.
 */
async function syncSubscription(subscriptionId: string) {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const user = await findUser(stripe, subscription, customerId);
  if (!user) {
    console.error("Stripe webhook: no user for subscription", subscriptionId);
    return;
  }

  const columns = stripeSubscriptionToColumns(subscription);
  if (!shouldApplyStripeSubscription(user, columns)) {
    console.log(
      "Stripe webhook: ignoring ended subscription",
      subscriptionId,
      "- user is on",
      user.subscriptionId,
    );
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...columns,
      subscriptionProvider: "stripe",
      stripeCustomerId: customerId,
    },
  });
  console.log(
    "Stripe webhook: user",
    user.id,
    "is now",
    columns.subscriptionPlan,
    columns.subscriptionStatus,
  );
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();

  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is missing!");
    return Response.json({ error: "Not configured" }, { status: 500 });
  }
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error("Stripe webhook: invalid signature", error);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const subscription = event.data.object.subscription;
        if (subscription) {
          await syncSubscription(
            typeof subscription === "string" ? subscription : subscription.id,
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        await syncSubscription(event.data.object.id);
        break;
      default:
        break;
    }
  } catch (error) {
    // A 500 makes Stripe retry, which is what we want for transient failures.
    console.error("Stripe webhook: error processing", event.type, error);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ received: true, eventType: event.type });
}
