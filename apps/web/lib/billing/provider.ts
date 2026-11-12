import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import Stripe from "stripe";

/**
 * Billing runs on two providers while subscriptions move from Paddle to
 * Stripe: new checkouts go to Stripe, subscriptions bought on Paddle stay
 * there until they end. `User.subscriptionProvider` says which one owns the
 * stored `subscriptionId` (null means Paddle: it predates Stripe).
 */
export type BillingProvider = "paddle" | "stripe";

interface SubscriptionOwner {
  subscriptionId: string | null;
  subscriptionProvider: string | null;
}

export function providerOf(user: {
  subscriptionProvider: string | null;
}): BillingProvider {
  return user.subscriptionProvider === "stripe" ? "stripe" : "paddle";
}

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

const PRICE_CACHE_MS = 5 * 60 * 1000;
let cachedProPrice: { id: string; expiresAt: number } | undefined;

/**
 * Price charged for the Pro plan. STRIPE_PRICE_ID pins one; otherwise it is
 * the default price of STRIPE_PRODUCT_ID, so changing the price in the
 * Stripe dashboard needs no new configuration here. The lookup is cached
 * only briefly so such a change reaches new checkouts within minutes.
 */
export async function getProPriceId(): Promise<string> {
  if (process.env.STRIPE_PRICE_ID) return process.env.STRIPE_PRICE_ID;
  if (cachedProPrice && cachedProPrice.expiresAt > Date.now()) {
    return cachedProPrice.id;
  }
  if (!process.env.STRIPE_PRODUCT_ID) {
    throw new Error("STRIPE_PRODUCT_ID (or STRIPE_PRICE_ID) is missing");
  }
  const product = await getStripe().products.retrieve(
    process.env.STRIPE_PRODUCT_ID,
  );
  const price = product.default_price;
  if (!price) {
    throw new Error(
      `Stripe product ${product.id} has no default price; set one or use STRIPE_PRICE_ID`,
    );
  }
  cachedProPrice = {
    id: typeof price === "string" ? price : price.id,
    expiresAt: Date.now() + PRICE_CACHE_MS,
  };
  return cachedProPrice.id;
}

/**
 * Which Paddle environment to talk to. Read through a computed key on
 * purpose: Next.js replaces `process.env.NEXT_PUBLIC_*` with its value at
 * build time, also in server code, and the build runs on a CI runner that
 * does not have the server's variables. Written the direct way, a build made
 * there would silently pin every Paddle call to the sandbox.
 */
export function paddleEnvironment(): Environment {
  const name = "NEXT_PUBLIC_PADDLE_ENV";
  return (process.env[name] as Environment | undefined) ?? Environment.sandbox;
}

export function getPaddle(): Paddle {
  if (!process.env.PADDLE_API_KEY) {
    throw new Error("PADDLE_API_KEY is missing");
  }
  return new Paddle(process.env.PADDLE_API_KEY, {
    environment: paddleEnvironment(),
  });
}

export function isBillingConfigured(provider: BillingProvider): boolean {
  return Boolean(
    provider === "stripe"
      ? process.env.STRIPE_SECRET_KEY
      : process.env.PADDLE_API_KEY,
  );
}

/** Stops renewal; access continues until the paid period ends. */
export async function cancelAtPeriodEnd(user: SubscriptionOwner) {
  if (!user.subscriptionId) throw new Error("No subscription to cancel");
  if (providerOf(user) === "stripe") {
    await getStripe().subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    await getPaddle().subscriptions.cancel(user.subscriptionId, {
      effectiveFrom: "next_billing_period",
    });
  }
}

/** Undoes a scheduled cancellation so the subscription renews as usual. */
export async function resumeRenewal(user: SubscriptionOwner) {
  if (!user.subscriptionId) throw new Error("No subscription to resume");
  if (providerOf(user) === "stripe") {
    await getStripe().subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: false,
    });
  } else {
    await getPaddle().subscriptions.update(user.subscriptionId, {
      scheduledChange: null,
    });
  }
}
