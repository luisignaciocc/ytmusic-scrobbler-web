import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// Upper bound, per list, on what one dashboard load reads from Stripe.
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

    // One item more than the cap is requested so a cut-off list is detectable.
    const upTo = { limit: MAX_ITEMS + 1 };
    const [active, trialing, customers, invoices] = await Promise.all([
      stripe.subscriptions.list({ status: "active", limit: 100 }).autoPagingToArray(upTo),
      stripe.subscriptions.list({ status: "trialing", limit: 100 }).autoPagingToArray(upTo),
      stripe.customers.list({ limit: 100 }).autoPagingToArray(upTo),
      stripe.invoices.list({ status: "paid", limit: 100 }).autoPagingToArray(upTo),
    ]);

    // Past the cap these figures are a sample of the most recent records,
    // not totals; the dashboard says so instead of showing them as complete.
    const lists = [active, trialing, customers, invoices];
    const truncated = lists.some((list) => list.length > MAX_ITEMS);
    for (const list of lists) list.length = Math.min(list.length, MAX_ITEMS);

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
      // When the money came in, not when the invoice was issued: an invoice
      // from last month paid after a retry counts for this month.
      .filter((i) => (i.status_transitions.paid_at ?? i.created) >= monthStartSeconds)
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
      truncated,
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
