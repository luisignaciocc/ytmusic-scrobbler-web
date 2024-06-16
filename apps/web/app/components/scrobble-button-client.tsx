"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { toggleScrobble } from "../actions";

export default function ScrobbleBtnClient({
  scrobbling,
}: {
  scrobbling: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleIsActive = async () => {
    if (loading) return;
    setLoading(true);
    await toggleScrobble(!scrobbling);
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={() => toggleIsActive()}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium text-gray-50 shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300",
        !scrobbling
          ? "bg-green-600 hover:bg-green-600/90"
          : "bg-red-600 hover:bg-red-600/90",
      )}
      disabled={loading}
    >
      {!scrobbling ? "Start Scrobbling" : "Pause Scrobbling"}
    </button>
  );
}
