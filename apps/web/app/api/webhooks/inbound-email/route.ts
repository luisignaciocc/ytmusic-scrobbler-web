/* eslint-disable no-console */
import { Prisma, PrismaClient } from "@prisma/client";
import { CreateEmailOptions, Resend } from "resend";

import {
  AccountStatus,
  runSupportAgent,
  SupportToolHandlers,
} from "@/lib/support/agent";
import {
  createDeletionToken,
  hasLiveSubscription,
  parseAddress,
  shouldSkipAutoReply,
} from "@/lib/support/guards";

export const runtime = "nodejs";
export const maxDuration = 60;

const prisma = new PrismaClient();

const MAX_REPLIES_PER_SENDER_PER_DAY = 3;
const MAX_BODY_CHARS = 6000;
// A row still "processing" after this long belongs to a crashed/timed-out
// attempt: a webhook retry may take it over (lease).
const LEASE_MS = 5 * 60 * 1000;

function config() {
  const {
    RESEND_API_KEY,
    RESEND_WEBHOOK_SECRET,
    SUPPORT_FROM,
    SUPPORT_ESCALATION_EMAIL,
    SUPPORT_OWN_DOMAINS,
    APP_URL,
  } = process.env;
  // Validated BEFORE an email is claimed, so a misconfiguration fails the
  // webhook (Resend retries) instead of silently dropping the message.
  if (!RESEND_API_KEY || !RESEND_WEBHOOK_SECRET || !SUPPORT_ESCALATION_EMAIL) {
    throw new Error(
      "RESEND_API_KEY, RESEND_WEBHOOK_SECRET and SUPPORT_ESCALATION_EMAIL are required",
    );
  }
  return {
    resend: new Resend(RESEND_API_KEY),
    webhookSecret: RESEND_WEBHOOK_SECRET,
    from: SUPPORT_FROM ?? "Bocono Labs Support <support@bocono-labs.com>",
    escalationEmail: SUPPORT_ESCALATION_EMAIL,
    ownDomains: (SUPPORT_OWN_DOMAINS ?? "bocono-labs.com")
      .split(",")
      .map((d) => d.trim().toLowerCase()),
    appUrl: APP_URL ?? "https://scrobbler.bocono-labs.com",
  };
}

type Config = ReturnType<typeof config>;

/** Resend resolves with `{ error }` instead of throwing: surface it. */
async function sendChecked(cfg: Config, payload: CreateEmailOptions) {
  const { error } = await cfg.resend.emails.send(payload);
  if (error) {
    throw new Error(`Resend send failed: ${error.name}: ${error.message}`);
  }
}

export async function POST(request: Request) {
  const cfg = config();

  // 1. Verify the Svix signature against the RAW body.
  const payload = await request.text();
  let event;
  try {
    event = cfg.resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: cfg.webhookSecret,
    });
  } catch {
    return new Response("Invalid webhook", { status: 400 });
  }

  if (event.type !== "email.received") return new Response("ignored");

  const { email_id: resendId, message_id: messageId, subject } = event.data;

  // 2. Claim the email (idempotency + lease). Duplicate deliveries are
  //    acknowledged only if the original attempt finished or is still fresh.
  try {
    await prisma.supportEmail.create({
      data: {
        resendId,
        messageId,
        fromAddress: parseAddress(event.data.from),
        subject: subject ?? "",
        status: "processing",
      },
    });
  } catch (error) {
    if (
      !(
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
    ) {
      throw error;
    }
    const takeover = await prisma.supportEmail.updateMany({
      where: {
        resendId,
        status: "processing",
        createdAt: { lt: new Date(Date.now() - LEASE_MS) },
      },
      data: { createdAt: new Date() }, // renew the lease
    });
    if (takeover.count === 0) return new Response("duplicate");
    console.warn(`inbound-email: taking over stale attempt ${resendId}`);
  }

  const finish = (data: Prisma.SupportEmailUpdateInput): Promise<unknown> =>
    prisma.supportEmail.update({ where: { resendId }, data });

  let fullEmail: { from: string; text: string } | undefined;

  try {
    // 3. The webhook carries metadata only: fetch the body.
    const { data: received, error } = await cfg.resend.emails.receiving.get(
      resendId,
    );
    if (error || !received) throw new Error(`fetch failed: ${error?.message}`);

    const text = (
      received.text ??
      (received.html ?? "").replace(/<[^>]+>/g, " ")
    )
      .replace(/\r/g, "")
      .slice(0, MAX_BODY_CHARS);
    const replyTo = received.reply_to?.[0] ?? received.from;
    fullEmail = { from: replyTo, text };

    // One identity for everything: lookup, reply destination and rate
    // limiting all use the address we would actually answer.
    const sender = parseAddress(replyTo);
    await finish({ fromAddress: sender });

    // 4. Guards: loops, bulk mail, per-sender quota.
    const skipReason = shouldSkipAutoReply({
      from: received.from,
      headers: received.headers,
      ownDomains: cfg.ownDomains,
    });
    if (skipReason) {
      await finish({ status: "skipped", detail: skipReason });
      return new Response("skipped");
    }

    // Counts other emails from this sender in the last 24h that replied,
    // escalated or are still processing. In-flight rows count, so concurrent
    // emails see each other and the cap cannot be exceeded (they may both
    // be held back, which is the safe direction).
    const others = await prisma.supportEmail.count({
      where: {
        fromAddress: sender,
        resendId: { not: resendId },
        status: { in: ["processing", "replied", "escalated"] },
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (others >= MAX_REPLIES_PER_SENDER_PER_DAY) {
      await sendChecked(cfg, {
        from: cfg.from,
        to: cfg.escalationEmail,
        replyTo,
        subject: `[support escalation] ${subject}`,
        text: `Reason: sender hit the daily auto-reply limit, needs a human.\nFrom: ${received.from}\n\n---\n${text}`,
      });
      await finish({ status: "escalated", detail: "rate limited" });
      return new Response("rate limited");
    }

    // 5. Resolve the account. The primary email wins. A notificationEmail is
    //    free-form and not unique, so it is only trusted when it identifies
    //    exactly one account; ambiguous matches are treated as "unknown".
    const matches = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { email: { equals: sender, mode: "insensitive" } },
          { notificationEmail: { equals: sender, mode: "insensitive" } },
        ],
      },
      take: 5,
    });
    const primary = matches.filter(
      (u) => u.email.toLowerCase() === sender,
    );
    const user =
      primary.length === 1
        ? primary[0]
        : primary.length === 0 && matches.length === 1
          ? matches[0]
          : null;

    const threadHeaders = { "In-Reply-To": messageId, References: messageId };

    const escalate = (reason: string) =>
      sendChecked(cfg, {
        from: cfg.from,
        to: cfg.escalationEmail,
        replyTo,
        subject: `[support escalation] ${subject}`,
        text: `Reason: ${reason}\nFrom: ${received.from}\nAccount found: ${user ? user.email : "no"}\n\n---\n${text}`,
      });

    const handlers: SupportToolHandlers = {
      async getAccountStatus(): Promise<AccountStatus> {
        if (!user) return { found: false };
        return {
          found: true,
          isActive: user.isActive,
          plan: user.subscriptionPlan,
          subscriptionStatus: user.subscriptionStatus,
          lastSuccessfulScrobble:
            user.lastSuccessfulScrobble?.toISOString() ?? null,
          lastFailureType: user.lastFailureType,
          lastFailedAt: user.lastFailedAt?.toISOString() ?? null,
          consecutiveFailures: user.consecutiveFailures,
          lastFmConnected: Boolean(user.lastFmSessionKey),
          youtubeCookieSet: Boolean(user.ytmusicCookie),
        };
      },

      sendReply: (body: string) =>
        sendChecked(cfg, {
          from: cfg.from,
          to: replyTo,
          bcc: cfg.escalationEmail,
          subject: /^re:/i.test(subject ?? "") ? subject : `Re: ${subject}`,
          text: body,
          headers: threadHeaders,
        }),

      async sendDeletionConfirmation() {
        if (!user) {
          return {
            ok: false,
            message:
              "No single account matches the sender's address (they may have signed up with another email).",
          };
        }
        if (hasLiveSubscription(user)) {
          return {
            ok: false,
            message:
              "The account has a live paid subscription; it must be cancelled at /pricing first.",
          };
        }
        const link = `${cfg.appUrl}/api/support/confirm-deletion?token=${createDeletionToken(user.id)}`;
        // Goes to the ACCOUNT's own email, never to an arbitrary sender.
        await sendChecked(cfg, {
          from: cfg.from,
          to: user.email,
          bcc: cfg.escalationEmail,
          subject: "Confirm deletion of your YTMusic Scrobbler account",
          text: `Hi ${user.name},\n\nWe received a request to delete your YouTube Music Scrobbler account and all associated data (credentials, Last.fm connection and scrobble history).\n\nTo confirm, open this link (valid for 48 hours):\n${link}\n\nIf you did not ask for this, ignore this email and nothing will be deleted.\n\n— Bocono Labs support (automated assistant)`,
        });
        return { ok: true, message: `confirmation sent to ${user.email}` };
      },

      escalate,
    };

    const outcome = await runSupportAgent(
      { from: received.from, subject: subject ?? "", text },
      handlers,
    );

    await finish({
      status: outcome.action === "escalated" ? "escalated" : "replied",
      category: outcome.category,
      action: outcome.action,
      detail: outcome.detail,
    });
    return new Response("ok");
  } catch (error) {
    console.error("inbound-email handler failed", error);
    const message = error instanceof Error ? error.message : String(error);
    let detail = message;
    // Never leave a user unanswered silently: tell the developer.
    try {
      await sendChecked(cfg, {
        from: cfg.from,
        to: cfg.escalationEmail,
        replyTo: fullEmail?.from,
        subject: `[support agent error] ${subject}`,
        text: `The agent failed on an inbound email (resend id ${resendId}).\nError: ${message}\nFrom: ${fullEmail?.from ?? event.data.from}\n\n${fullEmail?.text ?? "(body not fetched)"}`,
      });
    } catch (notifyError) {
      console.error("inbound-email: error notification failed", notifyError);
      detail = `${message} | DEVELOPER NOTIFICATION FAILED, needs manual follow-up`;
    }
    await finish({ status: "error", detail }).catch(() => undefined);
    // 200 so Resend does not retry; the failure is recorded on the row.
    return new Response("error handled");
  }
}
