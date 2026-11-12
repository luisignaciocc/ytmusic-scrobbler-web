import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

import PricingClient from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free scrobbling every hour, or Pro every 5 minutes. 30-day money-back guarantee.",
};

export default function PricingPage() {
  return (
    <main className="container py-10 md:py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Free, or faster with Pro
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Both plans scrobble everything you play. Pro does it sooner.
        </p>
      </div>

      <PricingClient />

      <section className="mx-auto mt-12 max-w-3xl rounded-2xl border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Why faster updates cost money</h2>
        <p className="mt-3 text-muted-foreground">
          Every check means reading a listening history and comparing it with
          what was already sent. Doing that twelve times as often for every
          account takes real server capacity, and the subscription pays for it,
          along with the maintenance and support of the service.
        </p>
        <p className="mt-3 text-muted-foreground">
          On either plan you get an email as soon as your YouTube Music cookie
          needs refreshing, so scrobbling is interrupted as little as possible.
        </p>
      </section>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        All paid plans include a 30-day money-back guarantee.{" "}
        <Link
          href="/terms"
          className="font-medium text-primary underline underline-offset-2"
        >
          Read the terms
        </Link>
      </p>
    </main>
  );
}
