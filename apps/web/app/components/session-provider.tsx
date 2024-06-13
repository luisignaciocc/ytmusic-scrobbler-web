"use client";
import { SessionProvider } from "next-auth/react";

interface Props {
  children: React.ReactNode;
}

function SessionAuthProvider({ children }: Props) {
  return <SessionProvider session={null}>{children}</SessionProvider>;
}

export default SessionAuthProvider;
