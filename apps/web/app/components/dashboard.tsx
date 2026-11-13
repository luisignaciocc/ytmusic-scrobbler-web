import type { User } from "@prisma/client";
import { ExternalLink, Zap } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import DynamicText from "@/components/ui/dynamic-text";
import Notice from "@/components/ui/notice";
import { cn } from "@/lib/utils";

import LastfmLogout from "./lastfm-logout";
import NotificationPreferences from "./notification-preferences";
import ScrobbleBtnClient from "./scrobble-button-client";

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(date: Date): string {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return relativeTime.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}

type Health = "active" | "paused" | "cookie" | "retrying";

function healthOf(user: User): Health {
  // The worker records AUTH when YouTube Music rejects the stored cookie.
  if (user.lastFailureType === "AUTH") return "cookie";
  if (!user.isActive) return "paused";
  if (user.consecutiveFailures > 0) return "retrying";
  return "active";
}

const HEALTH = {
  active: {
    dot: "bg-success",
    label: "Scrobbling",
    text: "Everything is working. New plays are sent to Last.fm on every check.",
  },
  paused: {
    dot: "bg-muted-foreground",
    label: "Paused",
    text: "Nothing is being sent to Last.fm until you start scrobbling again.",
  },
  cookie: {
    dot: "bg-destructive",
    label: "Needs your attention",
    text: "YouTube Music no longer accepts the cookie we have, so we can't read your history.",
  },
  retrying: {
    dot: "bg-warning",
    label: "Having trouble",
    text: "The last check failed for a reason that usually fixes itself. We keep retrying; there is nothing you need to do yet.",
  },
} as const;

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card p-6", className)}>
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Home page of a user who has finished setting up. */
export default function Dashboard({
  user,
  justConnected,
}: {
  user: User;
  justConnected: boolean;
}) {
  const health = healthOf(user);
  const { dot, label, text } = HEALTH[health];
  const isPro = user.subscriptionPlan === "pro";
  const interval = isPro ? "every 5 minutes" : "every hour";

  return (
    <main className="container max-w-4xl space-y-6 py-8 md:py-12">
      <h1 className="text-3xl font-bold tracking-tight">Your scrobbler</h1>

      {justConnected && health !== "cookie" && (
        <Notice tone="success" title="YouTube Music is connected">
          Your first plays will reach Last.fm on the next check ({interval}).
        </Notice>
      )}

      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2.5 text-xl font-semibold font-display">
              <span className={cn("h-3 w-3 rounded-full", dot)} aria-hidden="true" />
              <DynamicText>{label}</DynamicText>
            </p>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              <DynamicText>{text}</DynamicText>
            </p>
          </div>
          <div className="shrink-0">
            {health === "cookie" ? (
              <Link href="/setup" className={buttonVariants({ size: "lg" })}>
                Reconnect YouTube Music
              </Link>
            ) : (
              <ScrobbleBtnClient scrobbling={user.isActive} />
            )}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 border-t pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Last successful check
            </dt>
            <dd className="mt-1 font-medium">
              <DynamicText>
                {user.lastSuccessfulScrobble
                  ? timeAgo(user.lastSuccessfulScrobble)
                  : "Not yet"}
              </DynamicText>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Checks for new plays
            </dt>
            <dd className="mt-1 font-medium">
              {isPro ? "Every 5 minutes" : "Every hour"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Last.fm profile
            </dt>
            <dd className="mt-1 font-medium">
              {user.lastFmUsername ? (
                <a
                  href={`https://www.last.fm/user/${user.lastFmUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary underline underline-offset-2"
                >
                  {user.lastFmUsername}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : (
                "Connected"
              )}
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Plan">
          <p className="flex items-center gap-2 text-xl font-semibold font-display">
            {isPro && <Zap className="h-5 w-5 text-primary" aria-hidden="true" />}
            {isPro ? "Pro" : "Free"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPro
              ? "Your history is checked every 5 minutes and your account goes first in the queue."
              : "Your history is checked every hour. Pro checks every 5 minutes."}
          </p>
          <Link
            href="/pricing"
            className={buttonVariants({
              variant: isPro ? "outline" : "primary",
              className: "mt-4",
            })}
          >
            {isPro ? "Manage subscription" : "Upgrade to Pro"}
          </Link>
        </Card>

        <Card title="Connections">
          <ul className="divide-y">
            <li className="flex items-center justify-between gap-4 pb-4">
              <div className="min-w-0">
                <p className="font-medium">YouTube Music</p>
                <p className="text-sm text-muted-foreground">
                  {health === "cookie"
                    ? "The cookie has expired."
                    : "Cookie saved. It expires from time to time; that is normal."}
                </p>
              </div>
              <Link
                href="/setup"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Update
              </Link>
            </li>
            <li className="flex items-center justify-between gap-4 pt-4">
              <div className="min-w-0">
                <p className="font-medium">Last.fm</p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.lastFmUsername
                    ? `Connected as ${user.lastFmUsername}`
                    : "Connected"}
                </p>
              </div>
              <LastfmLogout />
            </li>
          </ul>
        </Card>
      </div>

      <Card title="Email notifications">
        <NotificationPreferences
          notificationEmail={user.notificationEmail}
          userEmail={user.email}
          notificationsEnabled={user.notificationsEnabled}
        />
      </Card>
    </main>
  );
}
