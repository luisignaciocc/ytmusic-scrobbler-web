"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import DynamicText from "@/components/ui/dynamic-text";

export default function LoginBtn({
  label = "Sign in with Google",
  callbackUrl = "/",
  className,
}: {
  label?: string;
  callbackUrl?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "failed">("idle");

  // Straight to Google instead of the intermediate page that lists sign-in
  // providers (there is only one). signIn() first makes requests of its own;
  // on a phone with a flaky connection they fail, and without this catch the
  // button would simply do nothing.
  const handleClick = async () => {
    setState("loading");
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setState("failed");
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        aria-busy={state === "loading"}
        className={buttonVariants({ variant: "primary", size: "lg", className })}
      >
        <DynamicText>
          {state === "loading" ? "Opening Google…" : label}
        </DynamicText>
      </button>
      {state === "failed" && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          We couldn&apos;t reach the server. Check your connection and try
          again.
        </p>
      )}
    </div>
  );
}
