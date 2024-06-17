"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LastfmLogoutBtn({
  logoutLastFm,
}: {
  logoutLastFm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    await logoutLastFm();
    setLoading(false);
    router.refresh();
  };
  return (
    <button
      onClick={handleLogout}
      className="inline-flex h-7 items-center justify-center rounded-md border border-gray-200 bg-white px-4 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
      disabled={loading}
    >
      Unlink Last.fm
    </button>
  );
}
