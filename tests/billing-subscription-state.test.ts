import { describe, expect, it } from "vitest";

import {
  shouldApplyStripeSubscription,
  stripeSubscriptionToColumns,
} from "../apps/web/lib/billing/subscription-state";

const PERIOD_END = 1_800_000_000;
const sub = (over: Record<string, unknown> = {}) => ({
  id: "sub_new",
  status: "active",
  cancel_at: null,
  cancel_at_period_end: false,
  items: { data: [{ current_period_end: PERIOD_END }] },
  ...over,
});

describe("stripeSubscriptionToColumns", () => {
  it("grants Pro while the subscription is paid or retrying payment", () => {
    for (const status of ["active", "trialing", "past_due"]) {
      const columns = stripeSubscriptionToColumns(sub({ status }));
      expect(columns.subscriptionPlan).toBe("pro");
      expect(columns.subscriptionStatus).toBe(status);
      expect(columns.subscriptionEndDate).toEqual(new Date(PERIOD_END * 1000));
      expect(columns.scheduledCancellationDate).toBeNull();
    }
  });

  it("stores ended subscriptions as free and 'cancelled'", () => {
    for (const status of ["canceled", "incomplete_expired", "unpaid"]) {
      const columns = stripeSubscriptionToColumns(
        sub({ status, cancel_at: PERIOD_END, cancel_at_period_end: true }),
      );
      expect(columns.subscriptionPlan).toBe("free");
      expect(columns.subscriptionStatus).toBe("cancelled");
      expect(columns.scheduledCancellationDate).toBeNull();
    }
  });

  it("does not grant Pro before the first payment succeeds", () => {
    expect(stripeSubscriptionToColumns(sub({ status: "incomplete" })).subscriptionPlan).toBe("free");
    expect(stripeSubscriptionToColumns(sub({ status: "paused" })).subscriptionPlan).toBe("free");
  });

  it("reports a scheduled cancellation and clears it when undone", () => {
    const scheduled = stripeSubscriptionToColumns(sub({ cancel_at_period_end: true }));
    expect(scheduled.subscriptionPlan).toBe("pro");
    expect(scheduled.scheduledCancellationDate).toEqual(new Date(PERIOD_END * 1000));

    const explicit = stripeSubscriptionToColumns(sub({ cancel_at: PERIOD_END - 100 }));
    expect(explicit.scheduledCancellationDate).toEqual(new Date((PERIOD_END - 100) * 1000));

    expect(stripeSubscriptionToColumns(sub()).scheduledCancellationDate).toBeNull();
  });
});

describe("shouldApplyStripeSubscription", () => {
  const live = stripeSubscriptionToColumns(sub());
  const ended = stripeSubscriptionToColumns(sub({ status: "canceled" }));

  it("applies any update about the stored subscription", () => {
    expect(shouldApplyStripeSubscription({ subscriptionId: "sub_new" }, ended)).toBe(true);
    expect(shouldApplyStripeSubscription({ subscriptionId: null }, ended)).toBe(true);
  });

  it("lets a paying subscription replace a different stored one", () => {
    expect(shouldApplyStripeSubscription({ subscriptionId: "sub_paddle" }, live)).toBe(true);
  });

  it("ignores a late cancellation of a subscription the user left behind", () => {
    expect(shouldApplyStripeSubscription({ subscriptionId: "sub_current" }, ended)).toBe(false);
  });
});
