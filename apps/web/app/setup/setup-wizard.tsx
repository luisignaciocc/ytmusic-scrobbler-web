"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import Notice from "@/components/ui/notice";
import { cn } from "@/lib/utils";
import { checkYtmusicCookie } from "@/lib/ytmusic-cookie";

import { SUPPORT_MAILTO } from "../../lib/support-contact";

interface GuideStep {
  title: string;
  description: React.ReactNode;
  image: { src: string; width: number; height: number };
}

const shot = (n: number, width = 1920, height = 879) => ({
  src: `/tutorial/step${n}.png`,
  width,
  height,
});

const GUIDE: GuideStep[] = [
  {
    title: "Open YouTube Music",
    description: (
      <>
        On a computer, go to{" "}
        <a
          href="https://music.youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-2"
        >
          music.youtube.com
        </a>{" "}
        in Chrome or Firefox and make sure you are signed in.
      </>
    ),
    image: shot(1),
  },
  {
    title: "Open the browser tools",
    description: "Press F12, or right-click anywhere and choose “Inspect”.",
    image: shot(2),
  },
  {
    title: "Go to the Network tab",
    description: "Click “Network” in the row of tabs at the top of the tools.",
    image: shot(3),
  },
  {
    title: "Show the search bar",
    description: "Click the filter icon (a funnel) so the search field appears.",
    image: shot(4),
  },
  {
    title: "Search for “browse”",
    description: "Type browse in the search field.",
    image: shot(5),
  },
  {
    title: "Move around YouTube Music",
    description:
      "Click around the site (Home, Explore, Library) until a request named “browse” shows up in the list.",
    image: shot(6),
  },
  {
    title: "Select the request",
    description: "Click any item named “browse” in the list.",
    image: shot(7),
  },
  {
    title: "Open its headers",
    description: "In the panel that opens, click the “Headers” tab.",
    image: shot(8),
  },
  {
    title: "Copy the cookie",
    description:
      "Scroll to “Request Headers”, find “Cookie” and copy its whole value. It is one very long line.",
    image: shot(9, 3821, 1955),
  },
];

const TOTAL = GUIDE.length + 1; // the guide, then the form

export default function SetupWizard({ isUpdate }: { isUpdate: boolean }) {
  // Someone refreshing an expired cookie has done this before: start at the form.
  const [step, setStep] = useState(isUpdate ? TOTAL : 1);
  const [cookie, setCookie] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onForm = step === TOTAL;
  const guide = onForm ? null : GUIDE[step - 1];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const check = checkYtmusicCookie(cookie);
    if (!check.ok) {
      setError(check.problem);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/youtube-headers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: check.cookie }),
      });
      if (response.ok) {
        // A full navigation, so the home page is rendered with the new state.
        window.location.assign("/?connected=1");
        return;
      }
      const data = await response.json().catch(() => null);
      setError(
        data?.error ??
          (response.status === 401
            ? "Your session expired. Sign in again and retry."
            : "We couldn't save the cookie. Please try again."),
      );
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    }
    setSaving(false);
  };

  return (
    <main className="container max-w-4xl py-8 md:py-12">
      <Link
        href="/"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Link>

      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        {isUpdate ? "Reconnect YouTube Music" : "Connect YouTube Music"}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        YouTube Music has no way to authorize apps, so we read your history the
        way your browser does: with its cookie. You copy it once from your
        browser and paste it here.
      </p>

      <div className="mt-8">
        <div className="flex items-center justify-between text-sm">
          <p className="font-medium">
            Step {step} of {TOTAL}
          </p>
          {!onForm && (
            <button
              type="button"
              onClick={() => setStep(TOTAL)}
              className="min-h-10 text-primary underline underline-offset-2"
            >
              I already have the cookie
            </button>
          )}
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL}
          aria-valuenow={step}
          aria-label="Setup progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${(step / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          disabled={step === 1}
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </button>
        {!onForm && (
          <button
            type="button"
            onClick={() => setStep((current) => Math.min(TOTAL, current + 1))}
            className={buttonVariants({ variant: "primary" })}
          >
            {step === GUIDE.length ? "I copied it" : "Next"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <section className="mt-4 rounded-xl border bg-card p-5 sm:p-6" aria-live="polite">
        {guide ? (
          <>
            <h2 className="text-xl font-semibold">{guide.title}</h2>
            <p className="mt-2 text-muted-foreground">{guide.description}</p>
            <a
              href={guide.image.src}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 block overflow-hidden rounded-lg border bg-muted"
            >
              <Image
                src={guide.image.src}
                alt={`Screenshot: ${guide.title}`}
                width={guide.image.width}
                height={guide.image.height}
                sizes="(min-width: 896px) 846px, 100vw"
                className="h-auto w-full"
                priority={step === 1}
              />
              <span className="sr-only">Open the screenshot at full size</span>
            </a>
            <p className="mt-2 text-xs text-muted-foreground">
              Click the screenshot to open it at full size.
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h2 className="text-xl font-semibold">Paste the cookie</h2>
            <label htmlFor="cookie" className="mt-2 block text-muted-foreground">
              The value you copied from “Cookie”, under “Request Headers”.
            </label>
            <textarea
              id="cookie"
              value={cookie}
              onChange={(event) => {
                setCookie(event.target.value);
                if (error) setError(null);
              }}
              rows={6}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "cookie-error" : undefined}
              placeholder="SID=…; HSID=…; SAPISID=…"
              className={cn(
                "mt-4 block w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground",
                error ? "border-destructive" : "border-input",
              )}
            />
            {error && (
              <div id="cookie-error" className="mt-3">
                <Notice tone="error">{error}</Notice>
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              className={buttonVariants({ size: "lg", className: "mt-5" })}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {saving ? "Saving…" : "Save and start scrobbling"}
            </button>
            <p className="mt-4 text-sm text-muted-foreground">
              Stuck?{" "}
              <a
                href={SUPPORT_MAILTO}
                className="font-medium text-primary underline underline-offset-2"
              >
                Email support
              </a>{" "}
              and we&apos;ll help you through it.
            </p>
          </form>
        )}
      </section>

    </main>
  );
}
