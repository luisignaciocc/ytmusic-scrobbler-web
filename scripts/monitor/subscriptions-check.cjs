// Production monitor, part 3: scrobbling activity and subscriptions.
// Piped over SSH and run ON the production server, from apps/web, so it can
// use the server's own .env and installed packages and no billing key has
// to be stored anywhere else:
//   cd apps/web && node --env-file=../../.env - [--verbose] < subscriptions-check.cjs
// Read-only: it only reads the database, Stripe and Paddle.
// Prints one line per check:  OK|WARN|FAIL <name> | <detail>
// Output ends up in public logs and issues, so by default it prints counts
// only. Run it by hand with --verbose to see which records are affected.
const { PrismaClient } = require("@prisma/client");

const verbose = process.argv.includes("--verbose");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
/** Statuses during which a customer is being billed and has Pro. */
const BILLED = ["active", "trialing", "past_due"];

const line = (level, name, detail) =>
  console.log(`${level.padEnd(4)} ${name} | ${detail}`);
/** Reports a list of problem records: a count in public, ids with --verbose. */
function report(name, problems, okDetail, failDetail) {
  if (problems.length === 0) return line("OK", name, okDetail);
  line("FAIL", name, `${problems.length} ${failDetail}`);
  if (verbose) for (const p of problems) console.log(`       - ${p}`);
}

async function checkScrobbling(prisma) {
  const activeUsers = await prisma.user.count({
    where: { isActive: true, deletedAt: null },
  });
  const latest = await prisma.user.aggregate({
    _max: { lastSuccessfulScrobble: true },
  });
  const last = latest._max.lastSuccessfulScrobble;
  const hoursAgo = last ? (Date.now() - last.getTime()) / HOUR : Infinity;
  const detail = `${activeUsers} active users, last successful scrobble ${
    last ? `${hoursAgo.toFixed(1)} hours ago` : "never"
  }`;
  // With active users someone is always listening; a long silence means the
  // worker, its queue or the YouTube Music parsing is broken.
  if (activeUsers > 0 && hoursAgo > 6) line("FAIL", "scrobbling", detail);
  else line("OK", "scrobbling", detail);
}

async function checkStaleSubscriptions(prisma) {
  // A billed subscription whose period ended days ago was never renewed in
  // our database: a renewal or cancellation webhook did not arrive.
  const stale = await prisma.user.findMany({
    where: {
      subscriptionPlan: "pro",
      subscriptionStatus: { in: BILLED },
      subscriptionEndDate: { lt: new Date(Date.now() - 3 * DAY) },
    },
    select: { id: true, subscriptionProvider: true, subscriptionId: true },
  });
  report(
    "pro-period-expired",
    stale.map((u) => `user ${u.id} (${u.subscriptionProvider ?? "paddle"} ${u.subscriptionId})`),
    "no Pro user is past the end of their paid period",
    "Pro user(s) are more than 3 days past the end of their paid period (a webhook was missed)",
  );
}

async function checkStripe(prisma) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return line("FAIL", "stripe-config", "STRIPE_SECRET_KEY is not set on the server");
  }
  const Stripe = require("stripe");
  const stripe = new (Stripe.default ?? Stripe)(process.env.STRIPE_SECRET_KEY);

  // --- subscriptions: Stripe versus our database
  const all = await stripe.subscriptions
    .list({ status: "all", limit: 100 })
    .autoPagingToArray({ limit: 5000 });
  const billed = all.filter((s) => BILLED.includes(s.status));
  const billedIds = new Set(billed.map((s) => s.id));

  const proOnStripe = await prisma.user.findMany({
    where: { subscriptionProvider: "stripe", subscriptionPlan: "pro" },
    select: { id: true, subscriptionId: true },
  });
  const proIds = new Set(proOnStripe.map((u) => u.subscriptionId));

  report(
    "stripe-paying-without-pro",
    billed.filter((s) => !proIds.has(s.id)).map((s) => `subscription ${s.id} (${s.status})`),
    `${billed.length} billed Stripe subscription(s), all have Pro here`,
    "customer(s) are being billed by Stripe but do not have Pro here",
  );
  report(
    "stripe-pro-without-paying",
    proOnStripe.filter((u) => !billedIds.has(u.subscriptionId)).map((u) => `user ${u.id} (${u.subscriptionId})`),
    "every Stripe Pro user here has a billed subscription in Stripe",
    "user(s) have Pro here without a billed subscription in Stripe",
  );

  const perCustomer = new Map();
  for (const s of billed) {
    const customer = typeof s.customer === "string" ? s.customer : s.customer.id;
    perCustomer.set(customer, [...(perCustomer.get(customer) ?? []), s.id]);
  }
  report(
    "stripe-double-billing",
    [...perCustomer].filter(([, ids]) => ids.length > 1).map(([c, ids]) => `customer ${c}: ${ids.join(", ")}`),
    "no customer has more than one billed subscription",
    "customer(s) have more than one billed subscription",
  );

  // --- webhook endpoint and deliveries
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const endpoint = endpoints.data.find((e) => e.url.endsWith("/api/webhooks/stripe"));
  const needed = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];
  if (!endpoint) {
    line("FAIL", "stripe-webhook-endpoint", "no webhook endpoint in Stripe points at /api/webhooks/stripe");
  } else if (endpoint.status !== "enabled") {
    line("FAIL", "stripe-webhook-endpoint", `the endpoint is ${endpoint.status} in Stripe`);
  } else {
    const missing = endpoint.enabled_events.includes("*")
      ? []
      : needed.filter((e) => !endpoint.enabled_events.includes(e));
    if (missing.length) line("FAIL", "stripe-webhook-endpoint", `enabled, but not subscribed to: ${missing.join(", ")}`);
    else line("OK", "stripe-webhook-endpoint", "enabled and subscribed to the events the app needs");
  }

  const undelivered = await stripe.events
    .list({
      delivery_success: false,
      created: { gte: Math.floor((Date.now() - 3 * DAY) / 1000) },
      limit: 100,
    })
    .autoPagingToArray({ limit: 300 });
  report(
    "stripe-webhook-deliveries",
    undelivered.map((e) => `${e.id} ${e.type}`),
    "no undelivered Stripe events in the last 3 days",
    "Stripe event(s) from the last 3 days were not delivered to the webhook",
  );
}

async function checkPaddle(prisma) {
  const proOnPaddle = await prisma.user.findMany({
    where: {
      subscriptionPlan: "pro",
      subscriptionId: { not: null },
      OR: [{ subscriptionProvider: null }, { subscriptionProvider: "paddle" }],
    },
    select: { id: true, subscriptionId: true },
  });
  if (!process.env.PADDLE_API_KEY) {
    // Fine once nobody is left on Paddle and the key has been retired.
    if (proOnPaddle.length === 0) return line("OK", "paddle", "no Paddle subscribers left and no Paddle key configured");
    return line("FAIL", "paddle-config", `${proOnPaddle.length} Pro user(s) are still on Paddle but PADDLE_API_KEY is not set`);
  }
  const { Paddle, Environment } = require("@paddle/paddle-node-sdk");
  // Tolerates a trailing comment in the .env value.
  const env = (process.env.NEXT_PUBLIC_PADDLE_ENV ?? "").replace(/"/g, "").trim().split(/\s+/)[0];
  const paddle = new Paddle(process.env.PADDLE_API_KEY, {
    environment: env === "production" ? Environment.production : Environment.sandbox,
  });

  const billed = [];
  const collection = paddle.subscriptions.list({ status: BILLED, perPage: 200 });
  do {
    billed.push(...(await collection.next()));
  } while (collection.hasMore && billed.length < 5000);
  const billedIds = new Set(billed.map((s) => s.id));
  const proIds = new Set(proOnPaddle.map((u) => u.subscriptionId));

  report(
    "paddle-paying-without-pro",
    billed.filter((s) => !proIds.has(s.id)).map((s) => `subscription ${s.id} (${s.status})`),
    `${billed.length} billed Paddle subscription(s), all have Pro here`,
    "customer(s) are being billed by Paddle but do not have Pro here on that subscription",
  );
  report(
    "paddle-pro-without-paying",
    proOnPaddle.filter((u) => !billedIds.has(u.subscriptionId)).map((u) => `user ${u.id} (${u.subscriptionId})`),
    "every Paddle Pro user here has a billed subscription in Paddle",
    "user(s) have Pro here without a billed subscription in Paddle",
  );
}

async function main() {
  const prisma = new PrismaClient();
  const sections = [
    ["scrobbling", checkScrobbling],
    ["pro-period-expired", checkStaleSubscriptions],
    ["stripe", checkStripe],
    ["paddle", checkPaddle],
  ];
  for (const [name, check] of sections) {
    try {
      await check(prisma);
    } catch (error) {
      // The message of an API error is safe to print; never the whole object.
      line("FAIL", name, `the check itself failed: ${String(error?.message ?? error).slice(0, 200)}`);
    }
  }
  await prisma.$disconnect();
  console.log("DONE subscriptions");
}

main();
