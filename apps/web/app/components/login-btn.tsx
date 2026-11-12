"use client";
import { signIn } from "next-auth/react";

import { buttonVariants } from "@/components/ui/button";

export default function LoginBtn({ label = "Sign in with Google" }: { label?: string }) {
  return (
    <button
      onClick={() => signIn()}
      className={buttonVariants({ variant: "primary", size: "lg" })}
    >
      {label}
    </button>
  );
}
