"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { buttonVariants } from "@/components/ui/button";

import { SUPPORT_MAILTO } from "../lib/support-contact";

/** Shown instead of a blank "Application error" when a page crashes. */
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="container max-w-xl py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">
        Something went wrong on this page
      </h1>
      <p className="mt-3 text-muted-foreground">
        Nothing was lost. Try again, and if it keeps happening, reload the
        page with your browser&apos;s automatic translation turned off.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={() => reset()} className={buttonVariants()}>
          Try again
        </button>
        <a
          href={SUPPORT_MAILTO}
          className={buttonVariants({ variant: "outline" })}
        >
          Email support
        </a>
      </div>
    </main>
  );
}
