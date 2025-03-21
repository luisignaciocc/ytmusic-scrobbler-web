"use client";

import type { Paddle } from "@paddle/paddle-js";
import { getPaddleInstance, initializePaddle } from "@paddle/paddle-js";
import { Environment } from "@paddle/paddle-node-sdk";
import React, { useCallback, useEffect, useState } from "react";

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

export default function PricingClient() {
  const [paddleInstance, setPaddleInstance] = useState<Paddle | undefined>(
    undefined,
  );
  const [paddleInitialized, setPaddleInitialized] = useState(false);
  const [proPrice, setProPrice] = useState("$3.00");

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

    try {
      paddleInstance.Checkout.open({
        items: [
          {
            priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID!,
            quantity: 1,
          },
        ],
        settings: {
          displayMode: "overlay",
          theme: "light",
        },
      });
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
        <button
          disabled
          className="block w-full text-center bg-gray-100 text-gray-800 py-3 rounded-lg cursor-not-allowed opacity-75"
        >
          Current Subscription
        </button>
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
        <button
          onClick={openCheckout}
          className="block w-full text-center bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Subscribe Now
        </button>
      </div>
    </div>
  );
}
