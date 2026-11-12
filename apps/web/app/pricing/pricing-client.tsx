"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import Notice from "@/components/ui/notice";

// Type for extended user session
interface SubscriptionInfo {
  subscriptionId?: string | null;
  subscriptionPlan: string;
  subscriptionStatus?: string | null;
  subscriptionEndDate?: string | null;
  scheduledCancellationDate?: string | null;
}

// Format date to readable string
const formatDate = (date: Date) => {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const Feature = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
    <span>{children}</span>
  </li>
);

export default function PricingClient() {
  const { data: session } = useSession();
  const [proPrice, setProPrice] = useState("$3.00");
  const [isLoading, setIsLoading] = useState(false);
  const [cancelStatus, setCancelStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    subscriptionPlan: "free",
  });
  const [loading, setLoading] = useState(true);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const latestRequest = useRef(0);
  const router = useRouter();

  // Function to fetch subscription info
  const fetchSubscriptionInfo = useCallback(async () => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    const mine = ++latestRequest.current;
    try {
      const response = await fetch("/api/subscription/info", {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        // Superseded by a newer request or by a cancel / keep action.
        if (mine === latestRequest.current) setSubscriptionInfo(data);
      } else {
        console.error("Failed to fetch subscription info");
      }
    } catch (error) {
      console.error("Error fetching subscription info:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  // Fetch subscription info when session changes
  useEffect(() => {
    fetchSubscriptionInfo();
  }, [fetchSubscriptionInfo]);

  // Add a separate effect for refreshing data periodically (but not immediately after actions)
  useEffect(() => {
    // Refresh data every 30 seconds - this will eventually sync with server state
    // but won't immediately override our optimistic updates
    const intervalId = setInterval(() => {
      fetchSubscriptionInfo();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [fetchSubscriptionInfo]);

  // Get user subscription data from subscription info
  const userSubscriptionPlan = subscriptionInfo.subscriptionPlan || "free";
  const userSubscriptionStatus = subscriptionInfo.subscriptionStatus || null;
  const userSubscriptionEndDate = subscriptionInfo.subscriptionEndDate
    ? new Date(subscriptionInfo.subscriptionEndDate)
    : null;

  const isActivePro =
    userSubscriptionPlan === "pro" &&
    (userSubscriptionStatus === "active" ||
      userSubscriptionStatus === "trialing") &&
    (!userSubscriptionEndDate || userSubscriptionEndDate > new Date());

  const isCancelledPro =
    userSubscriptionPlan === "pro" && userSubscriptionStatus === "cancelled";

  const hasScheduledCancellation = subscriptionInfo.scheduledCancellationDate
    ? new Date(subscriptionInfo.scheduledCancellationDate)
    : null;

  // Show the current price from Stripe (the default above is the fallback)
  useEffect(() => {
    fetch("/api/subscription/price")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.formatted) setProPrice(data.formatted);
      })
      .catch((error) => console.error("Error fetching price:", error));
  }, []);

  // Back from Stripe Checkout: the webhook that activates Pro can land a
  // moment after the redirect, so look again shortly.
  useEffect(() => {
    if (!window.location.search.includes("checkout=success")) return;
    const timeoutId = setTimeout(() => fetchSubscriptionInfo(), 3000);
    return () => clearTimeout(timeoutId);
  }, [fetchSubscriptionInfo]);

  // Send the user to Stripe Checkout
  const openCheckout = async () => {
    setIsLoading(true);
    setCancelStatus({});

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setCancelStatus({
        success: false,
        message:
          response.status === 401
            ? "Please sign in to subscribe."
            : data.error || "Failed to start checkout",
      });
    } catch (error) {
      console.error("Checkout error:", error);
      setCancelStatus({
        success: false,
        message: "An error occurred while starting checkout",
      });
    }
    setIsLoading(false);
  };

  // Cancel at period end, or undo that. The server answers with the
  // subscription as it now is, which is shown as is: no guessing here.
  const changeSubscription = async (
    endpoint: "/api/subscription/cancel" | "/api/subscription/cancel-scheduled",
    failure: string,
  ) => {
    setConfirmingCancel(false);
    setIsLoading(true);
    setCancelStatus({});
    // A background refresh that started before this finishes would bring
    // back the old state: make it discard its result.
    const mine = ++latestRequest.current;

    try {
      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        if (data.subscription && mine === latestRequest.current) {
          setSubscriptionInfo(data.subscription);
        }
        setCancelStatus({ success: true, message: data.message });
        // Other pages rendered on the server (the dashboard) show the plan too.
        router.refresh();
      } else {
        setCancelStatus({ success: false, message: data.error || failure });
      }
    } catch (error) {
      console.error(failure, error);
      setCancelStatus({ success: false, message: failure });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = () =>
    changeSubscription(
      "/api/subscription/cancel",
      "We couldn't cancel your subscription. Please try again.",
    );

  const cancelScheduledCancellation = () =>
    changeSubscription(
      "/api/subscription/cancel-scheduled",
      "We couldn't keep your subscription active. Please try again.",
    );

  const signedIn = Boolean(session?.user?.email);
  const fullWidth = "w-full";

  const message = cancelStatus.message && (
    <Notice tone={cancelStatus.success ? "success" : "error"}>
      {cancelStatus.message}
    </Notice>
  );

  let proAction: React.ReactNode;
  if (loading) {
    // Only on first load: later refreshes must not blank the buttons.
    proAction = (
      <div
        className="h-12 animate-pulse rounded-lg bg-muted"
        role="status"
        aria-label="Loading your subscription"
      />
    );
  } else if (!signedIn) {
    proAction = (
      <button
        onClick={() => signIn(undefined, { callbackUrl: "/pricing" })}
        className={buttonVariants({ size: "lg", className: fullWidth })}
      >
        Sign in to subscribe
      </button>
    );
  } else if (isActivePro && hasScheduledCancellation) {
    proAction = (
      <div className="space-y-3">
        <Notice tone="warning" title="Your subscription is set to end">
          You keep Pro until {formatDate(hasScheduledCancellation)}, then your
          account goes back to the free plan. You will not be charged again.
        </Notice>
        <button
          onClick={cancelScheduledCancellation}
          disabled={isLoading}
          aria-busy={isLoading}
          className={buttonVariants({ size: "lg", className: fullWidth })}
        >
          {isLoading ? "Saving…" : "Keep my subscription"}
        </button>
      </div>
    );
  } else if (isActivePro && confirmingCancel) {
    proAction = (
      <div className="space-y-3">
        <Notice tone="warning" title="Cancel Pro?">
          You keep Pro until the end of the period you already paid for
          {userSubscriptionEndDate
            ? ` (${formatDate(userSubscriptionEndDate)})`
            : ""}
          . After that, your history is checked every hour instead of every 5
          minutes.
        </Notice>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setConfirmingCancel(false)}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Keep Pro
          </button>
          <button
            onClick={cancelSubscription}
            className={buttonVariants({ variant: "danger", size: "lg" })}
          >
            Yes, cancel
          </button>
        </div>
      </div>
    );
  } else if (isActivePro) {
    proAction = (
      <div className="space-y-3">
        <p className="flex items-center justify-center gap-2 rounded-lg bg-success-soft py-3 text-sm font-medium text-success">
          <Check className="h-4 w-4" aria-hidden="true" />
          This is your plan
        </p>
        {userSubscriptionEndDate && (
          <p className="text-center text-xs text-muted-foreground">
            Current period ends on {formatDate(userSubscriptionEndDate)}.
          </p>
        )}
        <button
          onClick={() => setConfirmingCancel(true)}
          disabled={isLoading}
          aria-busy={isLoading}
          className={buttonVariants({
            variant: "ghost",
            className: `${fullWidth} text-muted-foreground`,
          })}
        >
          {isLoading ? "Saving…" : "Cancel subscription"}
        </button>
      </div>
    );
  } else if (isCancelledPro && userSubscriptionEndDate) {
    proAction = (
      <Notice tone="info" title="Your subscription has been cancelled">
        You keep Pro until {formatDate(userSubscriptionEndDate)}.
      </Notice>
    );
  } else {
    proAction = (
      <button
        onClick={openCheckout}
        disabled={isLoading}
        aria-busy={isLoading}
        className={buttonVariants({ size: "lg", className: fullWidth })}
      >
        {isLoading ? "Taking you to checkout…" : "Subscribe to Pro"}
      </button>
    );
  }

  const freeIsCurrent = signedIn && !loading && userSubscriptionPlan !== "pro";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="flex flex-col rounded-2xl border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Free</h2>
          <p className="mt-4 font-display text-4xl font-bold">$0</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything you play gets scrobbled, a little later.
          </p>
          <ul className="mt-6 flex-1 space-y-3 text-sm">
            <Feature>
              History checked <strong>every hour</strong>
            </Feature>
            <Feature>Scrobbles from any device or app</Feature>
            <Feature>Email when your cookie needs refreshing</Feature>
            <Feature>Email support</Feature>
          </ul>
          <div className="mt-8">
            {freeIsCurrent ? (
              <p className="flex items-center justify-center gap-2 rounded-lg bg-muted py-3 text-sm font-medium text-muted-foreground">
                <Check className="h-4 w-4" aria-hidden="true" />
                This is your plan
              </p>
            ) : signedIn ? null : (
              <Link
                href="/"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: fullWidth,
                })}
              >
                Get started for free
              </Link>
            )}
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border-2 border-primary bg-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Pro</h2>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              12× more frequent
            </span>
          </div>
          <p className="mt-4 font-display text-4xl font-bold">
            {proPrice}
            <span className="text-base font-medium text-muted-foreground">
              {" "}
              / month
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your Last.fm profile stays close to real time.
          </p>
          <ul className="mt-6 flex-1 space-y-3 text-sm">
            <Feature>
              History checked <strong>every 5 minutes</strong>
            </Feature>
            <Feature>Your account goes first in the queue</Feature>
            <Feature>Everything in Free</Feature>
            <Feature>Priority support</Feature>
          </ul>
          <div className="mt-8 space-y-3">
            {proAction}
            {!isActivePro && !isCancelledPro && (
              <p className="text-center text-xs text-muted-foreground">
                30-day money-back guarantee. Cancel any time.
              </p>
            )}
          </div>
        </section>
      </div>

      {message}
    </div>
  );
}
