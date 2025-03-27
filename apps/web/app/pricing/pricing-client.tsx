"use client";

import type { Paddle } from "@paddle/paddle-js";
import { getPaddleInstance, initializePaddle } from "@paddle/paddle-js";
import { Environment } from "@paddle/paddle-node-sdk";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState } from "react";

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

// Checkbox component for billing cycle toggle
const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-green-500 mr-2"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 13l4 4L19 7"
    ></path>
  </svg>
);

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    <p className="text-gray-600">Loading subscription information...</p>
  </div>
);

// Status badge component
const StatusBadge = ({
  status,
  message,
}: {
  status: "success" | "error" | "warning";
  message: string;
}) => (
  <div
    className={`mt-2 p-3 text-sm rounded-lg ${
      status === "success"
        ? "bg-green-50 text-green-800 border border-green-200"
        : status === "error"
          ? "bg-red-50 text-red-800 border border-red-200"
          : "bg-yellow-50 text-yellow-800 border border-yellow-200"
    }`}
  >
    {message}
  </div>
);

// Subscription status component
const SubscriptionStatus = ({
  status,
  endDate,
  scheduledCancellationDate,
}: {
  status: string | null;
  endDate: Date | null;
  scheduledCancellationDate: Date | null;
}) => {
  if (!status) return null;

  return (
    <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-2">Subscription Status</h3>
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Status: <span className="font-medium capitalize">{status}</span>
        </p>
        {endDate && (
          <p className="text-sm text-gray-600">
            End Date: {formatDate(endDate)}
          </p>
        )}
        {scheduledCancellationDate && (
          <p className="text-sm text-yellow-800">
            Scheduled Cancellation: {formatDate(scheduledCancellationDate)}
          </p>
        )}
      </div>
    </div>
  );
};

export default function PricingClient() {
  const { data: session } = useSession();
  const [paddleInstance, setPaddleInstance] = useState<Paddle | undefined>(
    undefined,
  );
  const [paddleInitialized, setPaddleInitialized] = useState(false);
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
  const [isFetching, setIsFetching] = useState(false);

  // Function to fetch subscription info
  const fetchSubscriptionInfo = useCallback(async () => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    setIsFetching(true);
    try {
      const response = await fetch("/api/subscription/info");
      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data);
      } else {
        console.error("Failed to fetch subscription info");
      }
    } catch (error) {
      console.error("Error fetching subscription info:", error);
    } finally {
      setLoading(false);
      setIsFetching(false);
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

  // Initialize Paddle when component mounts
  useEffect(() => {
    const setupPaddle = async () => {
      try {
        await initializePaddle({
          environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environment,
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        });

        const paddle = getPaddleInstance();
        setPaddleInstance(paddle);
        setPaddleInitialized(true);
      } catch (error) {
        console.error("Paddle initialization error:", error);
      }
    };

    setupPaddle();
  }, []);

  // Function to fetch the latest price from Paddle
  const updatePrice = useCallback(async () => {
    if (!paddleInitialized || !paddleInstance) return;

    try {
      const result = await paddleInstance.PricePreview({
        items: [
          {
            priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID!,
            quantity: 1,
          },
        ],
      });

      if (result.data.details.lineItems.length > 0) {
        setProPrice(result.data.details.lineItems[0].formattedTotals.total);
      }
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  }, [paddleInitialized, paddleInstance]);

  // Update price when Paddle is initialized
  useEffect(() => {
    if (paddleInitialized && paddleInstance) {
      updatePrice();
    }
  }, [paddleInitialized, paddleInstance, updatePrice]);

  // Open Paddle checkout
  const openCheckout = () => {
    if (!paddleInitialized || !paddleInstance) return;

    // Get user email from session
    const userEmail = session?.user?.email;

    try {
      // We'll use a global event listener for checkout completion
      // since Paddle.js doesn't expose direct event methods
      const checkoutCompletedListener = () => {
        // When the checkout completes, Paddle will redirect to the success URL
        // or emit a global paddle:complete event which we can listen for
        // We'll use a simple timeout to refresh data after checkout
        setTimeout(() => {
          fetchSubscriptionInfo();
        }, 3000);
      };

      // Try to attach to the window object for Paddle events
      if (typeof window !== "undefined") {
        window.addEventListener("paddle:complete", checkoutCompletedListener);
      }

      paddleInstance.Checkout.open({
        items: [
          {
            priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID!,
            quantity: 1,
          },
        ],
        customer: userEmail
          ? {
              email: userEmail,
            }
          : undefined,
        customData: {
          userEmail: userEmail,
        },
        settings: {
          displayMode: "overlay",
          theme: "light",
          successUrl: window.location.href, // Redirect to the same page
        },
      });
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    setIsLoading(true);
    setCancelStatus({});

    // Optimistically update the local state
    setSubscriptionInfo((prev) => ({
      ...prev,
      scheduledCancellationDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 30 days from now
    }));

    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCancelStatus({ success: true, message: data.message });
      } else {
        // Revert optimistic update on error
        setSubscriptionInfo((prev) => ({
          ...prev,
          scheduledCancellationDate: null,
        }));
        setCancelStatus({
          success: false,
          message: data.error || "Failed to cancel subscription",
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setSubscriptionInfo((prev) => ({
        ...prev,
        scheduledCancellationDate: null,
      }));
      console.error("Error cancelling subscription:", error);
      setCancelStatus({
        success: false,
        message: "An error occurred while cancelling your subscription",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel scheduled cancellation
  const cancelScheduledCancellation = async () => {
    setIsLoading(true);
    setCancelStatus({});

    // Optimistically update the local state
    setSubscriptionInfo((prev) => ({
      ...prev,
      scheduledCancellationDate: null,
    }));

    try {
      const response = await fetch("/api/subscription/cancel-scheduled", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCancelStatus({ success: true, message: data.message });
      } else {
        // Revert optimistic update on error
        setSubscriptionInfo((prev) => ({
          ...prev,
          scheduledCancellationDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 30 days from now
        }));
        setCancelStatus({
          success: false,
          message: data.error || "Failed to cancel scheduled cancellation",
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setSubscriptionInfo((prev) => ({
        ...prev,
        scheduledCancellationDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 30 days from now
      }));
      console.error("Error cancelling scheduled cancellation:", error);
      setCancelStatus({
        success: false,
        message:
          "An error occurred while cancelling the scheduled cancellation",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isFetching) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Subscription Status Section */}
      {session?.user?.email && (
        <SubscriptionStatus
          status={userSubscriptionStatus}
          endDate={userSubscriptionEndDate}
          scheduledCancellationDate={hasScheduledCancellation}
        />
      )}

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Free Tier */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Free</h2>
          <div className="text-4xl font-bold mb-6">$0</div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center">
              <CheckIcon />
              Basic scrobbling functionality
            </li>
            <li className="flex items-center">
              <CheckIcon />
              30-minute update interval
            </li>
            <li className="flex items-center">
              <CheckIcon />
              Basic support
            </li>
          </ul>

          {userSubscriptionPlan === "free" ? (
            <button
              disabled
              className="block w-full text-center bg-gray-100 text-gray-800 py-3 rounded-lg cursor-not-allowed opacity-75"
            >
              Current Plan
            </button>
          ) : (
            <button
              disabled
              className="block w-full text-center bg-gray-100 text-gray-800 py-3 rounded-lg cursor-not-allowed opacity-75"
            >
              Free Plan
            </button>
          )}
        </div>

        {/* Pro Tier */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500">
          <h2 className="text-2xl font-bold mb-4">Pro</h2>
          <div className="text-4xl font-bold mb-6">
            {proPrice}
            <span className="text-lg text-gray-500">/month</span>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center">
              <CheckIcon />
              Everything in Free
            </li>
            <li className="flex items-center">
              <CheckIcon />
              5-minute update interval
            </li>
            <li className="flex items-center">
              <CheckIcon />
              Priority support
            </li>
          </ul>

          {isActivePro ? (
            <div className="space-y-4">
              {hasScheduledCancellation ? (
                <>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                    Your subscription will be cancelled on{" "}
                    {formatDate(hasScheduledCancellation)}
                  </div>
                  <button
                    onClick={cancelScheduledCancellation}
                    disabled={isLoading}
                    className="block w-full text-center bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Processing..." : "Keep Subscription Active"}
                  </button>
                </>
              ) : (
                <button
                  onClick={cancelSubscription}
                  disabled={isLoading}
                  className="block w-full text-center bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Processing..." : "Cancel Pro Subscription"}
                </button>
              )}
            </div>
          ) : isCancelledPro && userSubscriptionEndDate ? (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                Your subscription will remain active until{" "}
                {formatDate(userSubscriptionEndDate)}
              </div>
              <button
                disabled
                className="block w-full text-center bg-gray-500 text-white py-3 rounded-lg opacity-90 cursor-not-allowed"
              >
                Subscription Ending
              </button>
            </div>
          ) : (
            <button
              onClick={openCheckout}
              className="block w-full text-center bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Subscribe Now
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {cancelStatus.message && (
        <StatusBadge
          status={cancelStatus.success ? "success" : "error"}
          message={cancelStatus.message}
        />
      )}
    </div>
  );
}
