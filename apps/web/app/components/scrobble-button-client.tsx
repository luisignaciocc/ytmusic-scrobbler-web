"use client";
import { Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";

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

  const Icon = scrobbling ? Pause : Play;

  return (
    <button
      onClick={() => toggleIsActive()}
      className={buttonVariants({
        variant: scrobbling ? "outline" : "primary",
        size: "lg",
      })}
      disabled={loading}
      aria-busy={loading}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {loading ? "Saving…" : scrobbling ? "Pause scrobbling" : "Start scrobbling"}
    </button>
  );
}
