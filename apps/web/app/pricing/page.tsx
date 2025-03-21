import Link from "next/link";
import React from "react";

import PricingClient from "./pricing-client";

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-16">
        {/* Alert */}
        <div
          className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-8"
          role="alert"
        >
          <p className="font-medium">Implementation Notice</p>
          <p>
            We are currently implementing our pricing structure. During this
            period, all users have access to 5-minute update intervals.
            We&apos;ll notify you when the pricing tiers are fully implemented.
          </p>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that best fits your needs
          </p>
        </div>

        <PricingClient />

        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">
              Why We Charge for Faster Updates
            </h2>
            <p className="text-gray-600 mb-4">
              Our service requires significant computational resources to
              process and sync your music data between YouTube Music and
              Last.fm. Here&apos;s what your subscription helps us cover:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Server infrastructure costs to process scrobbles</li>
              <li>Maintenance and development of the service</li>
              <li>Customer support and service reliability</li>
            </ul>
            <p className="mt-6 text-gray-600">
              The free tier checks for new music every 30 minutes, while the Pro
              tier checks every 5 minutes. This means Pro users get their
              Last.fm profile updated much more quickly, but it also means we
              need to process 6 times more requests for Pro users.
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600">
            All plans include a 30-day money-back guarantee.{" "}
            <Link href="/terms" className="text-blue-500 hover:underline">
              View our terms and conditions
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
