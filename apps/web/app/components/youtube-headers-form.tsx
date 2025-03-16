"use client";

import Image from "next/image";
import { useState } from "react";

export default function YouTubeHeadersForm() {
  const [cookie, setCookie] = useState("");
  const [authUser, setAuthUser] = useState("");
  const [origin] = useState("https://music.youtube.com");
  const [visitorData, setVisitorData] = useState("");
  const [authorization, setAuthorization] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/youtube-headers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cookie,
          authUser,
          origin,
          visitorData,
          authorization,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save headers");
      }

      window.location.reload();
    } catch (error) {
      console.error("Error saving headers:", error);
      alert("There was an error saving your information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Open YouTube Music",
      description: "Go to music.youtube.com in your Chrome or Firefox browser",
      image: "/tutorial/step1.png",
    },
    {
      title: "Open Browser Tools",
      description: "Press F12 or right-click and select 'Inspect'",
      image: "/tutorial/step2.png",
    },
    {
      title: "Go to Network Tab",
      description: "Click on the 'Network' tab at the top",
      image: "/tutorial/step3.png",
    },
    {
      title: "Enable Filter Bar",
      description: "Click on the 'Filter' icon (funnel) to show the search bar",
      image: "/tutorial/step4.png",
    },
    {
      title: "Filter Requests",
      description: "Type 'browse' in the search field",
      image: "/tutorial/step5.png",
    },
    {
      title: "Navigate Website",
      description:
        "Browse through YouTube Music until a 'browse' request appears in the network list",
      image: "/tutorial/step6.png",
    },
    {
      title: "Select Request",
      description: "Click on any 'browse' request that appears in the list",
      image: "/tutorial/step7.png",
    },
    {
      title: "View Headers",
      description:
        "In the new panel, click on the 'Headers' tab to see request details",
      image: "/tutorial/step8.png",
    },
    {
      title: "Copy Headers",
      description:
        "Scroll down to 'Request Headers' section and copy the required values (Authorization, Cookie, X-Goog-AuthUser, X-Goog-Visitor-Id)",
      image: "/tutorial/step9.png",
    },
  ];

  return (
    <div className="w-full">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
      >
        {isExpanded ? "Hide Setup" : "Setup YouTube Music"}
      </button>

      {isExpanded && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Connect Your YouTube Music Account
            </h3>

            <div className="space-y-6">
              {/* Tutorial Steps */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium">Step-by-Step Guide</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setCurrentStep(Math.max(1, currentStep - 1))
                      }
                      disabled={currentStep === 1}
                      className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentStep(Math.min(steps.length, currentStep + 1))
                      }
                      disabled={currentStep === steps.length}
                      className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="relative rounded-lg overflow-hidden bg-gray-50 p-4">
                  <div className="text-center mb-4">
                    <h5 className="font-medium text-lg mb-2">
                      {steps[currentStep - 1].title}
                    </h5>
                    <p className="text-gray-600">
                      {steps[currentStep - 1].description}
                    </p>
                  </div>
                  <div className="relative h-64 w-full">
                    <Image
                      src={steps[currentStep - 1].image}
                      alt={`Step ${currentStep}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex justify-center mt-4">
                    {steps.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentStep(idx + 1)}
                        className={`w-2 h-2 rounded-full mx-1 ${
                          currentStep === idx + 1
                            ? "bg-blue-600"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="authorization"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Authorization
                    <span className="text-xs text-gray-500 ml-2">
                      (Find &quot;Authorization&quot; in Request Headers)
                    </span>
                  </label>
                  <textarea
                    id="authorization"
                    value={authorization}
                    onChange={(e) => setAuthorization(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                    placeholder="Copy and paste the Authorization value here..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="cookie"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Cookie
                    <span className="text-xs text-gray-500 ml-2">
                      (Find &quot;Cookie&quot; in Request Headers)
                    </span>
                  </label>
                  <textarea
                    id="cookie"
                    value={cookie}
                    onChange={(e) => setCookie(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                    placeholder="Copy and paste the Cookie value here..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="authUser"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    X-Goog-AuthUser
                    <span className="text-xs text-gray-500 ml-2">
                      (Find &quot;X-Goog-AuthUser&quot; in Request Headers)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="authUser"
                    value={authUser}
                    onChange={(e) => setAuthUser(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                    placeholder="Usually '0'"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="visitorData"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    X-Goog-Visitor-Id
                    <span className="text-xs text-gray-500 ml-2">
                      (Find &quot;X-Goog-Visitor-Id&quot; in Request Headers)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="visitorData"
                    value={visitorData}
                    onChange={(e) => setVisitorData(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                    placeholder="Copy and paste the X-Goog-Visitor-Id value here..."
                    required
                  />
                </div>

                <input type="hidden" id="origin" value={origin} />

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                >
                  {loading ? "Saving..." : "Save and Continue"}
                </button>

                <p className="text-sm text-gray-500 mt-4">
                  Need help? Watch our{" "}
                  <a href="/tutorial" className="text-blue-500 hover:underline">
                    detailed video tutorial
                  </a>{" "}
                  or{" "}
                  <a
                    href="mailto:me@luisignacio.cc"
                    className="text-blue-500 hover:underline"
                  >
                    contact us
                  </a>
                  .
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
