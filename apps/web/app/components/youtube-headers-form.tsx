"use client";

import { useState } from "react";

export default function YouTubeHeadersForm() {
  const [cookie, setCookie] = useState("");
  const [authUser, setAuthUser] = useState("");
  const [origin, setOrigin] = useState("https://music.youtube.com");
  const [loading, setLoading] = useState(false);

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
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
        <h3 className="text-xl font-bold">YouTube Music Headers</h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            To get your YouTube Music headers:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Open YouTube Music in your browser</li>
            <li>Open Developer Tools (F12 or Ctrl+Shift+I)</li>
            <li>Go to the Network tab</li>
            <li>Filter requests by typing &quot;browse&quot;</li>
            <li>Play any song or scroll the page</li>
            <li>Click on any &quot;browse&quot; request</li>
            <li>In the Headers tab, find these values:</li>
            <ul className="list-disc list-inside ml-4 mt-2">
              <li>Cookie (under Request Headers)</li>
              <li>X-Goog-AuthUser (under Request Headers)</li>
            </ul>
          </ol>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="cookie"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Cookie
            </label>
            <textarea
              id="cookie"
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              required
            />
          </div>
          <div>
            <label
              htmlFor="authUser"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              X-Goog-AuthUser
            </label>
            <input
              type="text"
              id="authUser"
              value={authUser}
              onChange={(e) => setAuthUser(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
          <div>
            <label
              htmlFor="origin"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Origin
            </label>
            <input
              type="url"
              id="origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Headers"}
          </button>
        </form>
      </div>
    </div>
  );
}
