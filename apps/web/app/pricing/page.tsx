import Link from "next/link";
import React from "react";

import PricingClient from "./pricing-client";

export default function PricingPage() {
  return (
    <main className="flex-1 bg-gray-100">
      <div className="container mx-auto px-4 py-16">
        {/* La alerta ya está en el layout principal, la eliminamos de aquí */}

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
              The free tier checks for new music every 30 minutes and the Pro
              tier checks every 5 minutes. All users receive immediate
              notifications when their YouTube Music headers need updating,
              ensuring minimal interruption to the scrobbling service.
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
    </main>
  );
}
