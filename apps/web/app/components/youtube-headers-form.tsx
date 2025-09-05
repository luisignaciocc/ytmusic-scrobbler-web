"use client";

import Image from "next/image";
import { useState } from "react";

import Modal from "./modal";

interface Step {
  title: string;
  description: string;
  image?: string;
  isForm?: boolean;
}

interface YouTubeHeadersFormProps {
  buttonText?: string;
  buttonClassName?: string;
}

export default function YouTubeHeadersForm({
  buttonText = "Setup YouTube Music",
  buttonClassName = "w-full inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300",
}: YouTubeHeadersFormProps) {
  const [cookie, setCookie] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const steps: Step[] = [
    {
      title: "Open YouTube Music",
      description:
        'Go to <a href="https://music.youtube.com" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">music.youtube.com</a> in your Chrome or Firefox browser',
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
      title: "Show Search Bar",
      description: "Click on the 'Filter' icon (funnel) to show the search bar",
      image: "/tutorial/step4.png",
    },
    {
      title: "Search for 'browse'",
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
      title: "Select an Item",
      description: "Click on any item named 'browse' that appears in the list",
      image: "/tutorial/step7.png",
    },
    {
      title: "View Connection Details",
      description:
        "In the new panel, click on the 'Headers' tab to see connection details",
      image: "/tutorial/step8.png",
    },
    {
      title: "Copy Connection Details",
      description:
        "Scroll down to 'Request Headers' section and copy the 'Cookie' value",
      image: "/tutorial/step9.png",
    },
    {
      title: "Enter Connection Details",
      description: "Enter the connection details you copied in the form below",
      isForm: true,
    },
  ];

  const currentStepData = steps[currentStep - 1];

  return (
    <div className="w-full">
      <button onClick={() => setIsModalOpen(true)} className={buttonClassName}>
        {buttonText}
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Connect Your YouTube Music Account"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium">Step-by-Step Guide</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentStep(Math.min(steps.length, currentStep + 1))
                }
                disabled={currentStep === steps.length}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Next
              </button>
            </div>
          </div>

          {currentStepData.isForm ? (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 max-w-2xl mx-auto"
            >
              <div className="space-y-2">
                <label
                  htmlFor="cookie"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Cookie
                  <span className="text-xs text-gray-500 ml-2">
                    (Find in the Connection Details under &quot;Cookie&quot;)
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

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
              >
                {loading ? "Saving..." : "Save and Continue"}
              </button>

              <p className="text-sm text-gray-500 mt-4">
                Need help?{" "}
                <a
                  href="mailto:hi@bocono-labs.com"
                  className="text-blue-500 hover:underline"
                >
                  Contact us
                </a>
                .
              </p>
            </form>
          ) : (
            <div className="rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
              <div className="text-center mb-4">
                <h5 className="font-medium text-lg mb-2">
                  {currentStepData.title}
                </h5>
                <p
                  className="text-gray-600 dark:text-gray-400"
                  dangerouslySetInnerHTML={{
                    __html: currentStepData.description,
                  }}
                />
              </div>
              <div className="relative h-[600px] w-full">
                <Image
                  src={currentStepData.image!}
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
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
