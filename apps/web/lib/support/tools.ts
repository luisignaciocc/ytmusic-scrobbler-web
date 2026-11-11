import type { Prisma, PrismaClient, User } from "@prisma/client";

/**
 * Account-fixing operations used by the support agent. They are plain
 * functions over (prisma, user) so they can be unit tested; the route binds
 * `user` to the sender's own account, so a tool can never touch another one.
 */

export interface Authentication {
  spf?: string | null;
  dkim?: string | null;
  dmarc?: string | null;
}

/**
 * A sender is "verified" when the receiving MTA authenticated the From
 * domain, AND the reply address is the From address (Reply-To could point
 * anywhere). Only verified senders may trigger state changes.
 */
export function isVerifiedSender(
  auth: Authentication | null | undefined,
  fromAddress: string,
  replyAddress: string,
): boolean {
  if (!auth) return false;
  if (fromAddress !== replyAddress) return false;
  const aligned =
    auth.dmarc === "pass" || (auth.dkim === "pass" && auth.spf === "pass");
  return aligned;
}

export const REQUIRED_COOKIE_KEYS = [
  "__Secure-3PAPISID",
  "__Secure-3PSID",
  "SAPISID",
  "SID",
  "HSID",
  "SSID",
  "APISID",
] as const;

export interface CredentialDiagnostics {
  cookieStored: boolean;
  cookieLength?: number;
  hasRequiredKey?: boolean; // __Secure-3PAPISID: without it every request fails
  cookieNamesPresent?: string[];
  looksTruncated?: boolean;
  lastFmConnected: boolean;
  credentialsLastUpdatedAt: string;
}

/** Structure only: never returns cookie values. */
export function inspectCredentials(
  user: Pick<User, "ytmusicCookie" | "lastFmSessionKey" | "updatedAt">,
): CredentialDiagnostics {
  const out: CredentialDiagnostics = {
    cookieStored: Boolean(user.ytmusicCookie),
    lastFmConnected: Boolean(user.lastFmSessionKey),
    credentialsLastUpdatedAt: user.updatedAt.toISOString(),
  };
  if (user.ytmusicCookie) {
    const names = user.ytmusicCookie
      .split(";")
      .map((p) => p.trim().split("=")[0])
      .filter(Boolean);
    out.cookieLength = user.ytmusicCookie.length;
    out.cookieNamesPresent = names.filter((n) =>
      (REQUIRED_COOKIE_KEYS as readonly string[]).includes(n),
    );
    out.hasRequiredKey = names.includes("__Secure-3PAPISID");
    out.looksTruncated =
      user.ytmusicCookie.includes("…") || user.ytmusicCookie.length < 500;
  }
  return out;
}

export async function getRecentActivity(
  prisma: PrismaClient,
  user: User,
): Promise<object> {
  const [count, recent] = await Promise.all([
    prisma.song.count({ where: { userId: user.id } }),
    prisma.song.findMany({
      where: { userId: user.id },
      orderBy: { addedAt: "desc" },
      take: 8,
      select: { title: true, artist: true, addedAt: true },
    }),
  ]);
  return {
    trackedSongsInDb: count,
    recentTracks: recent.map((s) => ({
      title: s.title,
      artist: s.artist,
      addedAt: s.addedAt.toISOString(),
    })),
    lastSuccessfulScrobble: user.lastSuccessfulScrobble?.toISOString() ?? null,
    accountCreatedAt: user.createdAt.toISOString(),
  };
}

export type ActionResult = { ok: boolean; message: string };

/**
 * Re-enables a paused account whose credentials are still stored and clears
 * the failure counters / circuit-breaker cooldown, and queues an immediate
 * sync. Same effect as the user re-saving their credentials in the UI.
 * Cannot help when the cookie was cleared (AUTH failures wipe it): the user
 * must paste a new one.
 */
export async function reactivateAccount(
  prisma: PrismaClient,
  user: User,
): Promise<ActionResult> {
  if (!user.ytmusicCookie) {
    return {
      ok: false,
      message:
        "No YouTube Music cookie is stored (an authentication failure clears it). The user must paste a new one on the website; nothing can be fixed from our side.",
    };
  }
  if (!user.lastFmSessionKey) {
    return {
      ok: false,
      message:
        "Last.fm is not connected. The user must connect Last.fm on the website.",
    };
  }
  if (!inspectCredentials(user).hasRequiredKey) {
    return {
      ok: false,
      message:
        "The stored cookie lacks __Secure-3PAPISID so it can never work. The user must paste the full Cookie header from a 'browse' request.",
    };
  }
  const data: Prisma.UserUpdateInput = {
    isActive: true,
    consecutiveFailures: 0,
    lastFailureType: null,
    lastFailedAt: null,
    authNotificationCount: 0,
    lastNotificationSent: null,
  };
  if (user.subscriptionPlan !== "pro") data.isFirstTimeReady = true;
  await prisma.user.update({ where: { id: user.id }, data });
  return {
    ok: true,
    message:
      "Account reactivated, failure counters reset and an immediate sync queued (it runs in the next few minutes).",
  };
}

export async function updateNotificationSettings(
  prisma: PrismaClient,
  user: User,
  opts: { enabled?: boolean; senderAddress: string; useSenderAddress?: boolean },
): Promise<ActionResult> {
  const data: Prisma.UserUpdateInput = {};
  if (typeof opts.enabled === "boolean") data.notificationsEnabled = opts.enabled;
  // Only ever the verified sender's own address, never a model-chosen one.
  if (opts.useSenderAddress) data.notificationEmail = opts.senderAddress;
  if (Object.keys(data).length === 0) {
    return { ok: false, message: "Nothing to change." };
  }
  await prisma.user.update({ where: { id: user.id }, data });
  return { ok: true, message: `Notification settings updated: ${JSON.stringify(data)}` };
}

/**
 * Stops renewal; access continues until the paid period ends. No refunds.
 * `cancel` performs the cancellation at whichever provider bills the user.
 */
export async function cancelSubscriptionAtPeriodEnd(
  cancel: () => Promise<unknown>,
  user: Pick<User, "subscriptionId" | "subscriptionStatus">,
  isLive: (u: { subscriptionId: string | null; subscriptionStatus: string | null }) => boolean,
): Promise<ActionResult> {
  if (!user.subscriptionId || !isLive(user)) {
    return { ok: false, message: "There is no active subscription to cancel." };
  }
  await cancel();
  return {
    ok: true,
    message:
      "Subscription cancelled: it will not renew and access continues until the end of the current billing period. No refund was issued.",
  };
}
