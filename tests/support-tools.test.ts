import { describe, expect, it, vi } from "vitest";

import {
  cancelSubscriptionAtPeriodEnd,
  inspectCredentials,
  isVerifiedSender,
  reactivateAccount,
  updateNotificationSettings,
} from "../apps/web/lib/support/tools";

const goodCookie = "SID=a; HSID=b; __Secure-3PAPISID=c; " + "x=".padEnd(600, "y");
const baseUser = {
  id: "u1",
  ytmusicCookie: goodCookie,
  lastFmSessionKey: "k",
  subscriptionPlan: "free",
  updatedAt: new Date("2026-01-01"),
} as never;

const fakePrisma = () => ({ user: { update: vi.fn(async () => ({})) } }) as never;

describe("isVerifiedSender", () => {
  it("requires aligned authentication and no Reply-To mismatch", () => {
    expect(isVerifiedSender({ dmarc: "pass" }, "a@x.com", "a@x.com")).toBe(true);
    expect(isVerifiedSender({ dkim: "pass", spf: "pass" }, "a@x.com", "a@x.com")).toBe(true);
    expect(isVerifiedSender({ dkim: "pass", spf: "fail" }, "a@x.com", "a@x.com")).toBe(false);
    expect(isVerifiedSender({ dmarc: "pass" }, "a@x.com", "evil@y.com")).toBe(false);
    expect(isVerifiedSender(null, "a@x.com", "a@x.com")).toBe(false);
  });
});

describe("inspectCredentials", () => {
  it("never returns cookie values", () => {
    const d = inspectCredentials(baseUser);
    expect(JSON.stringify(d)).not.toContain("y".repeat(20));
    expect(d.hasRequiredKey).toBe(true);
    expect(d.looksTruncated).toBe(false);
  });
  it("flags a cookie without __Secure-3PAPISID", () => {
    expect(inspectCredentials({ ...(baseUser as object), ytmusicCookie: "SID=a" } as never).hasRequiredKey).toBe(false);
  });
});

describe("reactivateAccount", () => {
  it("reactivates, resets counters and queues a sync for free users", async () => {
    const prisma = fakePrisma();
    const r = await reactivateAccount(prisma, baseUser);
    expect(r.ok).toBe(true);
    expect((prisma as never as { user: { update: ReturnType<typeof vi.fn> } }).user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: expect.objectContaining({ isActive: true, consecutiveFailures: 0, authNotificationCount: 0, isFirstTimeReady: true }),
    });
  });
  it("refuses when the cookie was cleared or is unusable", async () => {
    const prisma = fakePrisma();
    expect((await reactivateAccount(prisma, { ...(baseUser as object), ytmusicCookie: null } as never)).ok).toBe(false);
    expect((await reactivateAccount(prisma, { ...(baseUser as object), ytmusicCookie: "SID=a" } as never)).ok).toBe(false);
    expect((await reactivateAccount(prisma, { ...(baseUser as object), lastFmSessionKey: null } as never)).ok).toBe(false);
  });
});

describe("updateNotificationSettings", () => {
  it("only ever uses the sender's own address", async () => {
    const prisma = fakePrisma();
    await updateNotificationSettings(prisma, baseUser, { senderAddress: "me@x.com", useSenderAddress: true, enabled: true });
    expect((prisma as never as { user: { update: ReturnType<typeof vi.fn> } }).user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { notificationsEnabled: true, notificationEmail: "me@x.com" },
    });
  });
});

describe("cancelSubscriptionAtPeriodEnd", () => {
  it("cancels at period end for live subscriptions only", async () => {
    const cancel = vi.fn(async () => ({}));
    const live = () => true;
    const r = await cancelSubscriptionAtPeriodEnd({ subscriptions: { cancel } }, { subscriptionId: "s1", subscriptionStatus: "active" } as never, live);
    expect(r.ok).toBe(true);
    expect(cancel).toHaveBeenCalledWith("s1", { effectiveFrom: "next_billing_period" });
    const none = await cancelSubscriptionAtPeriodEnd({ subscriptions: { cancel } }, { subscriptionId: null, subscriptionStatus: null } as never, () => false);
    expect(none.ok).toBe(false);
  });
});
