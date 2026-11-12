"use client";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const LogoutBtn = () => {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <button
      onClick={() => signOut()}
      className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span>Sign out</span>
    </button>
  );
};

export default LogoutBtn;
