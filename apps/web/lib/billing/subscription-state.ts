/**
 * Pure translation of a Stripe subscription into the columns we keep on User.
 * No Stripe runtime import, so it can be unit tested on its own.
 *
 * The status strings stored in the DB follow the ones Paddle already wrote
 * ("cancelled" with two l's), because the web app, the worker and the admin
 * all read them.
 */

export interface StripeSubscriptionLike {
  id: string;
  status: string;
  cancel_at: number | null;
  cancel_at_period_end: boolean;
  items: { data: Array<{ current_period_end: number }> };
}

export interface SubscriptionColumns {
  subscriptionId: string;
  subscriptionStatus: string;
  subscriptionPlan: "pro" | "free";
  subscriptionEndDate: Date | null;
  scheduledCancellationDate: Date | null;
}

/** Stripe statuses during which the customer keeps Pro. */
const PRO_STATUSES = ["active", "trialing", "past_due"];
/** Stripe statuses that mean the subscription is over for good. */
const ENDED_STATUSES = ["canceled", "incomplete_expired", "unpaid"];

const toDate = (seconds: number) => new Date(seconds * 1000);

export function stripeSubscriptionToColumns(
  sub: StripeSubscriptionLike,
): SubscriptionColumns {
  // Since the 2025 API versions the billing period lives on each item.
  const periodEnds = sub.items.data.map((item) => item.current_period_end);
  const periodEnd = periodEnds.length > 0 ? Math.max(...periodEnds) : null;
  const ended = ENDED_STATUSES.includes(sub.status);

  let scheduledCancellationDate: Date | null = null;
  if (!ended) {
    if (sub.cancel_at) {
      scheduledCancellationDate = toDate(sub.cancel_at);
    } else if (sub.cancel_at_period_end && periodEnd) {
      scheduledCancellationDate = toDate(periodEnd);
    }
  }

  return {
    subscriptionId: sub.id,
    subscriptionStatus: ended ? "cancelled" : sub.status,
    subscriptionPlan: PRO_STATUSES.includes(sub.status) ? "pro" : "free",
    subscriptionEndDate: periodEnd ? toDate(periodEnd) : null,
    scheduledCancellationDate,
  };
}

/**
 * Stripe does not guarantee webhook order, and a user can have an old,
 * ended subscription next to their current one. An event about a different
 * subscription may only replace what is stored when it grants Pro; otherwise
 * a late "canceled" for an old subscription would downgrade a paying user.
 */
export function shouldApplyStripeSubscription(
  stored: { subscriptionId: string | null },
  incoming: SubscriptionColumns,
): boolean {
  if (!stored.subscriptionId) return true;
  if (stored.subscriptionId === incoming.subscriptionId) return true;
  return incoming.subscriptionPlan === "pro";
}
