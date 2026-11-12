"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";

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
      className={buttonVariants({ variant: "outline", size: "sm" })}
      disabled={loading}
    >
      Unlink
    </button>
  );
}
