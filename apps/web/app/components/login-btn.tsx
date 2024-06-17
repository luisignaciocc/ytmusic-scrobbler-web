"use client";
import { signIn, useSession } from "next-auth/react";

export default function LoginBtn() {
  const { data: session } = useSession();
  if (session) {
    return (
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:focus-visible:ring-gray-300">
        Signed in as {session.user?.name?.split(" ")[0]}
      </div>
    );
  }
  return (
    <button
      onClick={() => signIn()}
      className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
    >
      Sign in
    </button>
  );
}
