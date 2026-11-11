import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// Upper bound on what one dashboard load reads from Stripe.
const MAX_ITEMS = 1000;

const emptyStats = {
  subscriptions: { active: 0, trialing: 0, total: 0 },
  customers: { total: 0 },
  revenue: { mrr: 0, arr: 0, totalRevenue: 0, monthlyRevenue: 0 },
};

/** Same shape as /api/stats/paddle so the dashboard renders both alike. */
export async function GET() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        error: "STRIPE_SECRET_KEY not configured",
        ...emptyStats,
        lastUpdated: new Date().toISOString(),
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const [subscriptions, customers, invoices] = await Promise.all([
      stripe.subscriptions
        .list({ status: "all", limit: 100 })
        .autoPagingToArray({ limit: MAX_ITEMS }),
      stripe.customers.list({ limit: 100 }).autoPagingToArray({ limit: MAX_ITEMS }),
      stripe.invoices
        .list({ status: "paid", limit: 100 })
        .autoPagingToArray({ limit: MAX_ITEMS }),
    ]);

    const active = subscriptions.filter((s) => s.status === "active");
    const trialing = subscriptions.filter((s) => s.status === "trialing");

    // Monthly recurring revenue, in cents
    let mrrCents = 0;
    for (const subscription of active) {
      for (const item of subscription.items.data) {
        const amount = (item.price.unit_amount ?? 0) * (item.quantity ?? 1);
        const recurring = item.price.recurring;
        if (!recurring) continue;
        const months =
          recurring.interval === "year"
            ? 12 * recurring.interval_count
            : recurring.interval === "month"
              ? recurring.interval_count
              : 0;
        if (months > 0) mrrCents += amount / months;
      }
    }

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthStartSeconds = monthStart.getTime() / 1000;

    const totalRevenueCents = invoices.reduce((sum, i) => sum + i.amount_paid, 0);
    const monthlyRevenueCents = invoices
      .filter((i) => i.created >= monthStartSeconds)
      .reduce((sum, i) => sum + i.amount_paid, 0);

    const mrr = mrrCents / 100;
    return NextResponse.json({
      subscriptions: {
        active: active.length,
        trialing: trialing.length,
        total: active.length + trialing.length,
      },
      customers: { total: customers.length },
      revenue: {
        mrr: Number(mrr.toFixed(2)),
        arr: Number((mrr * 12).toFixed(2)),
        totalRevenue: Number((totalRevenueCents / 100).toFixed(2)),
        monthlyRevenue: Number((monthlyRevenueCents / 100).toFixed(2)),
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching Stripe stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch Stripe statistics" },
      { status: 500 },
    );
  }
}
