import { Clock, Music, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../../lib/support-contact";
import Faq from "./faq";
import LastfmBtn from "./lastfm-btn";
import LoginBtn from "./login-btn";
import SetupSteps from "./setup-steps";

// Illustration only: what a Last.fm profile looks like once this is running.
const EXAMPLE_SCROBBLES = [
  { title: "15 Step", artist: "Radiohead", when: "Scrobbling now" },
  { title: "Seven Goblins", artist: "Masayoshi Takanaka", when: "4 minutes ago" },
  { title: "Plastic Love", artist: "Mariya Takeuchi", when: "9 minutes ago" },
  { title: "Weird Fishes / Arpeggi", artist: "Radiohead", when: "14 minutes ago" },
];

const HOW_IT_WORKS = [
  {
    Icon: RefreshCw,
    title: "We read your history",
    text: "Every hour on the free plan, every 5 minutes on Pro, we look at your YouTube Music listening history for new songs.",
  },
  {
    Icon: Music,
    title: "New songs go to Last.fm",
    text: "Each new song is scrobbled once, in the order you played it. We keep track of what was already sent to avoid duplicates.",
  },
  {
    Icon: ShieldCheck,
    title: "We tell you if it stops",
    text: "YouTube sessions expire from time to time. When yours does, we email you and scrobbling resumes as soon as you reconnect.",
  },
];

/** The page for visitors and for users who have not finished setting up. */
export default function Landing({ step }: { step: number }) {
  const steps = [
    {
      title: "Sign in with Google",
      description: "Create your account. It's free.",
      action: <LoginBtn />,
    },
    {
      title: "Connect Last.fm",
      description: "Authorize this app on your Last.fm account, in one click.",
      action: <LastfmBtn />,
    },
    {
      title: "Connect YouTube Music",
      description:
        "Follow a guide with screenshots to copy one value from your browser. It takes about 3 minutes.",
      action: (
        <Link href="/setup" className={buttonVariants({ size: "lg" })}>
          Connect YouTube Music
        </Link>
      ),
    },
    {
      title: "Done",
      description: "Your music shows up on Last.fm by itself from then on.",
    },
  ];

  return (
    <main>
      <section className="container grid items-center gap-10 py-10 md:py-16 lg:grid-cols-[1fr_420px] lg:gap-16">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Scrobble YouTube Music to Last.fm, automatically
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Everything you listen to on YouTube Music, on any device, ends up on
            your Last.fm profile. Set it up once and forget about it.
          </p>
          <div className="mt-8 max-w-xl">
            <SetupSteps steps={steps} current={step} />
          </div>
        </div>

        <figure className="mx-auto w-full max-w-md lg:max-w-none">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold">Recent tracks</p>
            <ul className="mt-3 divide-y">
              {EXAMPLE_SCROBBLES.map((track, index) => (
                <li key={track.title} className="flex items-center gap-3 py-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"
                  >
                    <Music className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {track.title}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {track.artist}
                    </span>
                  </span>
                  <span
                    className={
                      index === 0
                        ? "shrink-0 text-xs font-medium text-primary"
                        : "shrink-0 text-xs text-muted-foreground"
                    }
                  >
                    {track.when}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <figcaption className="mt-3 text-center text-xs text-muted-foreground">
            Example of how your plays appear on Last.fm
          </figcaption>
        </figure>
      </section>

      <section className="border-y bg-muted/50">
        <div className="container py-12 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ Icon, title, text }) => (
              <li key={title} className="rounded-xl border bg-card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Free, or faster with Pro
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <h3 className="font-semibold">Free</h3>
            </div>
            <p className="mt-3 text-3xl font-bold font-display">Every hour</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your history is checked once an hour. Everything you played gets
              scrobbled, a little later.
            </p>
          </div>
          <div className="rounded-xl border-2 border-primary bg-card p-6">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="font-semibold">Pro</h3>
            </div>
            <p className="mt-3 text-3xl font-bold font-display">
              Every 5 minutes
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your profile stays close to real time, and your account goes first
              in the queue.
            </p>
          </div>
        </div>
        <Link
          href="/pricing"
          className={buttonVariants({ variant: "outline", className: "mt-6" })}
        >
          See pricing
        </Link>
      </section>

      <section className="border-t bg-muted/50">
        <div className="container max-w-3xl py-12 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-8">
            <Faq />
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Something else? Email{" "}
            <a
              href={SUPPORT_MAILTO}
              className="font-medium text-primary underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            and our support assistant will reply, usually within minutes. If it
            can&apos;t solve your problem, it forwards your email to the
            developer.
          </p>
        </div>
      </section>
    </main>
  );
}
