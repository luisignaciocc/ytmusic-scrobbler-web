/**
 * Daily email to the maintainer with how the service did the day before.
 * Kept short on purpose; the maintainer can reply to it with questions,
 * which the analyst agent of the web app answers by querying the database
 * (apps/web/lib/analyst).
 *
 * Runs from DailyReportService every morning, and by hand with:
 *   node -e "require('./apps/worker/dist/daily-report').sendDailyReportNow()"
 */
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

/** "Yesterday" and the send time are in this zone (the maintainer's, UTC-3). */
export const REPORT_TIME_ZONE = "America/Argentina/Buenos_Aires";

export interface DailyStats {
  day: Date; // start of the reported day
  scrobbles: number;
  scrobblesDayBefore: number;
  scrobblingUsers: number;
  newUsers: number;
  newUsersDayBefore: number;
  totalUsers: number;
  activeUsers: number;
  pro: { total: number; stripe: number; paddle: number; endingSoon: number };
  newProSubscriptions: number | null; // null when Stripe could not be read
  cookiesExpired: number;
  lostUsers: { total: number; last30Days: number };
  supportEmails: number;
  supportEscalated: number;
}

/** Offset of `timeZone` from UTC at `at`, in milliseconds. */
function zoneOffset(at: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** [start, end) of the calendar day `daysAgo` days before `now`, in `timeZone`. */
export function dayRange(
  now: Date,
  daysAgo: number,
  timeZone = REPORT_TIME_ZONE,
): { start: Date; end: Date } {
  const local = new Date(now.getTime() + zoneOffset(now, timeZone));
  const midnightUtc = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() - daysAgo,
  );
  const start = new Date(midnightUtc - zoneOffset(new Date(midnightUtc), timeZone));
  const nextUtc = midnightUtc + 24 * 60 * 60 * 1000;
  const end = new Date(nextUtc - zoneOffset(new Date(nextUtc), timeZone));
  return { start, end };
}

/** Stripe subscriptions created in [start, end), or null if Stripe fails. */
async function countNewStripeSubscriptions(start: Date, end: Date) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    const params = new URLSearchParams({
      status: "all",
      limit: "100",
      "created[gte]": String(Math.floor(start.getTime() / 1000)),
      "created[lt]": String(Math.floor(end.getTime() / 1000)),
    });
    const res = await fetch(`https://api.stripe.com/v1/subscriptions?${params}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: unknown[] };
    return body.data.length;
  } catch {
    return null;
  }
}

export async function collectDailyStats(
  prisma: PrismaClient,
  now = new Date(),
): Promise<DailyStats> {
  const { start, end } = dayRange(now, 1);
  const before = dayRange(now, 2);
  const inDay = { gte: start, lt: end };
  const alive = { deletedAt: null };
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  // A user whose YouTube Music session expired: the worker clears the cookie
  // on an authentication failure, and they have not pasted a new one since.
  const lost = {
    ...alive,
    ytmusicCookie: null,
    lastFmSessionKey: { not: null },
    lastFailedAt: { not: null },
  };

  const [
    scrobbles,
    scrobblesDayBefore,
    scrobblingUsers,
    newUsers,
    newUsersDayBefore,
    totalUsers,
    activeUsers,
    proStripe,
    proPaddle,
    endingSoon,
    cookiesExpired,
    lostTotal,
    lostRecent,
    supportEmails,
    supportEscalated,
    newProSubscriptions,
  ] = await Promise.all([
    prisma.song.count({ where: { addedAt: inDay } }),
    prisma.song.count({ where: { addedAt: { gte: before.start, lt: before.end } } }),
    prisma.song
      .groupBy({ by: ["userId"], where: { addedAt: inDay } })
      .then((rows) => rows.length),
    prisma.user.count({ where: { ...alive, createdAt: inDay } }),
    prisma.user.count({
      where: { ...alive, createdAt: { gte: before.start, lt: before.end } },
    }),
    prisma.user.count({ where: alive }),
    prisma.user.count({ where: { ...alive, isActive: true } }),
    prisma.user.count({
      where: { ...alive, subscriptionPlan: "pro", subscriptionProvider: "stripe" },
    }),
    prisma.user.count({
      where: {
        ...alive,
        subscriptionPlan: "pro",
        OR: [{ subscriptionProvider: "paddle" }, { subscriptionProvider: null }],
      },
    }),
    prisma.user.count({
      where: { ...alive, subscriptionPlan: "pro", scheduledCancellationDate: { not: null } },
    }),
    prisma.user.count({
      where: { ...alive, lastFailureType: "AUTH", lastFailedAt: inDay },
    }),
    prisma.user.count({ where: lost }),
    prisma.user.count({ where: { ...lost, lastFailedAt: { gte: thirtyDaysAgo } } }),
    prisma.supportEmail.count({ where: { createdAt: inDay } }),
    prisma.supportEmail.count({ where: { createdAt: inDay, status: "escalated" } }),
    countNewStripeSubscriptions(start, end),
  ]);

  return {
    day: start,
    scrobbles,
    scrobblesDayBefore,
    scrobblingUsers,
    newUsers,
    newUsersDayBefore,
    totalUsers,
    activeUsers,
    pro: {
      total: proStripe + proPaddle,
      stripe: proStripe,
      paddle: proPaddle,
      endingSoon,
    },
    newProSubscriptions,
    cookiesExpired,
    lostUsers: { total: lostTotal, last30Days: lostRecent },
    supportEmails,
    supportEscalated,
  };
}

const n = (value: number) => value.toLocaleString("es-AR");

export function formatDailyReport(stats: DailyStats): {
  subject: string;
  text: string;
} {
  const dayName = new Intl.DateTimeFormat("es-AR", {
    timeZone: REPORT_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(stats.day);
  const shortDay = new Intl.DateTimeFormat("es-AR", {
    timeZone: REPORT_TIME_ZONE,
    day: "numeric",
    month: "short",
  }).format(stats.day);

  const newPro =
    stats.newProSubscriptions === null ? "n/d" : n(stats.newProSubscriptions);

  const lines = [
    `Resumen del ${dayName} (hora de Argentina).`,
    "",
    "Scrobbling",
    `- Canciones scrobbleadas: ${n(stats.scrobbles)} (el día anterior: ${n(stats.scrobblesDayBefore)}), de ${n(stats.scrobblingUsers)} usuarios. No incluye repeticiones de una misma canción.`,
    "",
    "Usuarios",
    `- Nuevos: ${n(stats.newUsers)} (el día anterior: ${n(stats.newUsersDayBefore)})`,
    `- Total: ${n(stats.totalUsers)}, con el scrobbling activado: ${n(stats.activeUsers)}`,
    "",
    "Suscripciones Pro",
    `- Nuevas: ${newPro}`,
    `- Total: ${n(stats.pro.total)} (Stripe ${n(stats.pro.stripe)}, Paddle ${n(stats.pro.paddle)}), con cancelación programada: ${n(stats.pro.endingSoon)}`,
    "",
    "Sesiones de YouTube Music",
    `- Caducaron ayer: ${n(stats.cookiesExpired)}`,
    `- Caducadas y sin reconectar: ${n(stats.lostUsers.total)} (${n(stats.lostUsers.last30Days)} en los últimos 30 días)`,
    "",
    "Soporte",
    `- Correos recibidos: ${n(stats.supportEmails)}, escalados a ti: ${n(stats.supportEscalated)}`,
    "",
    "Responde a este correo con cualquier pregunta sobre los datos y te contesto consultando la base.",
  ];

  return {
    subject: `Scrobbler, ${shortDay}: ${n(stats.scrobbles)} scrobbles, ${n(stats.newUsers)} usuarios nuevos`,
    text: lines.join("\n"),
  };
}

export async function sendDailyReport(prisma: PrismaClient, now = new Date()) {
  const to = process.env.REPORT_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!to || !apiKey) {
    throw new Error("REPORT_EMAIL and RESEND_API_KEY are required for the daily report");
  }
  const { subject, text } = formatDailyReport(await collectDailyStats(prisma, now));
  const { error } = await new Resend(apiKey).emails.send({
    from: "YTMusic Scrobbler <noreply@bocono-labs.com>",
    to,
    // Replies reach the inbound support webhook, which hands questions from
    // this address to the analyst agent.
    replyTo: process.env.REPORT_REPLY_TO || process.env.SUPPORT_REPLY_TO || undefined,
    subject,
    text,
  });
  if (error) throw new Error(`Daily report not sent: ${error.message}`);
  return subject;
}

/** For running by hand on the server; see the comment at the top. */
export async function sendDailyReportNow() {
  const prisma = new PrismaClient();
  try {
    // eslint-disable-next-line no-console -- run by hand, the output is the point
    console.log("sent:", await sendDailyReport(prisma));
  } finally {
    await prisma.$disconnect();
  }
}
