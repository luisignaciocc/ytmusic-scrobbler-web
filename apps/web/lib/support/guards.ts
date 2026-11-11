import { createHmac, timingSafeEqual } from "crypto";

/** Extracts the bare address from `Name <addr@x.com>` or `addr@x.com`. */
export function parseAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).trim().toLowerCase();
}

const AUTOMATED_LOCAL_PARTS =
  /^(no-?reply|do-?not-?reply|mailer-daemon|postmaster|bounce|bounces|notifications?|alerts?)([+._-].*)?$/i;

/**
 * Loop / bulk-mail protection. Returns a reason string when we must NOT
 * auto-reply, or null when the email looks like a real human message.
 */
export function shouldSkipAutoReply(opts: {
  from: string;
  headers: Record<string, string> | null;
  ownDomains: string[];
}): string | null {
  const address = parseAddress(opts.from);
  const [local = "", domain = ""] = address.split("@");

  if (!local || !domain) return "unparseable sender";
  if (AUTOMATED_LOCAL_PARTS.test(local)) return "automated sender address";
  if (opts.ownDomains.includes(domain)) return "sender is our own domain";

  const headers = Object.fromEntries(
    Object.entries(opts.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const autoSubmitted = headers["auto-submitted"];
  if (autoSubmitted && autoSubmitted.toLowerCase() !== "no") {
    return `Auto-Submitted: ${autoSubmitted}`;
  }
  if (/^(bulk|junk|list|auto_reply)$/i.test(headers["precedence"] ?? "")) {
    return `Precedence: ${headers["precedence"]}`;
  }
  if (headers["x-auto-response-suppress"] || headers["list-unsubscribe"]) {
    return "bulk / auto-response-suppressed mail";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Signed, expiring deletion-confirmation tokens (HMAC, no DB state needed)
// ---------------------------------------------------------------------------

const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.SUPPORT_TOKEN_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("SUPPORT_TOKEN_SECRET / NEXTAUTH_SECRET is not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret())
    .update(`delete-account:${payload}`)
    .digest("base64url");
}

export function createDeletionToken(userId: string, now = Date.now()): string {
  const payload = `${userId}.${now + TOKEN_TTL_MS}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

/** Returns the userId if the token is authentic and not expired, else null. */
export function verifyDeletionToken(
  token: string,
  now = Date.now(),
): string | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString();
  } catch {
    return null;
  }

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }

  const lastDot = payload.lastIndexOf(".");
  const userId = payload.slice(0, lastDot);
  const expiresAt = Number(payload.slice(lastDot + 1));
  if (!userId || !Number.isFinite(expiresAt) || expiresAt < now) return null;
  return userId;
}

/** Subscriptions that must be cancelled before we can delete the account. */
export function hasLiveSubscription(user: {
  subscriptionId: string | null;
  subscriptionStatus: string | null;
}): boolean {
  if (!user.subscriptionId) return false;
  // "unpaid" (Stripe): no Pro access, but the subscription still exists and
  // resumes billing once its open invoice is paid.
  return ["active", "trialing", "past_due", "paused", "unpaid"].includes(
    user.subscriptionStatus ?? "",
  );
}
