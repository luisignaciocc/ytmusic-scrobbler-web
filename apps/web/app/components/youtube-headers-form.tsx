"use client";

import { useState } from "react";

export default function YouTubeHeadersForm() {
  const [cookie, setCookie] = useState("");
  const [authUser, setAuthUser] = useState("");
  const [origin, setOrigin] = useState("https://music.youtube.com");
  const [visitorData, setVisitorData] = useState("");
  const [authorization, setAuthorization] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
      alert("Failed to save headers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
      >
        {isExpanded ? "Hide YouTube Music Setup" : "Setup YouTube Music"}
      </button>

      {isExpanded && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              YouTube Music Headers
            </h3>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <p>To get your YouTube Music headers:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Open YouTube Music in your browser</li>
                <li>Open Developer Tools (F12 or Ctrl+Shift+I)</li>
                <li>Go to the Network tab</li>
                <li>Filter requests by typing &quot;browse&quot;</li>
                <li>Play any song or scroll the page</li>
                <li>Click on any &quot;browse&quot; request</li>
                <li>In the Headers tab, find these values:</li>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Authorization (under Request Headers)</li>
                  <li>Cookie (under Request Headers)</li>
                  <li>X-Goog-AuthUser (under Request Headers)</li>
                  <li>X-Goog-Visitor-Id (under Request Headers)</li>
                </ul>
              </ol>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="authorization"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Authorization
              </label>
              <textarea
                id="authorization"
                value={authorization}
                onChange={(e) => setAuthorization(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                placeholder="Paste your Authorization header here..."
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="cookie"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Cookie
              </label>
              <textarea
                id="cookie"
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                placeholder="Paste your Cookie header here..."
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="authUser"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                X-Goog-AuthUser
              </label>
              <input
                type="text"
                id="authUser"
                value={authUser}
                onChange={(e) => setAuthUser(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                placeholder="e.g., 0"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="visitorData"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                X-Goog-Visitor-Id
              </label>
              <input
                type="text"
                id="visitorData"
                value={visitorData}
                onChange={(e) => setVisitorData(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                placeholder="Paste your X-Goog-Visitor-Id header here..."
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="origin"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Origin (optional)
              </label>
              <input
                type="url"
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                placeholder="https://music.youtube.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
            >
              {loading ? "Saving..." : "Save Headers"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
