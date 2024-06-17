"use client";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const LogoutBtn = () => {
  const { data: session } = useSession();

  const handleLogout = () => {
    signOut();
  };

  if (!session) {
    return null;
  }

  return (
    <button onClick={handleLogout}>
      <LogOut />
    </button>
  );
};

export default LogoutBtn;

<LogOut />;
