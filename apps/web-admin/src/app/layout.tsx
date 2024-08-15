import type { Metadata } from "next";
import "./globals.css";
import SessionAuthProvider from "./components/session-auth-provider";

export const metadata: Metadata = {
  title: "Admin",
  description: "Administrative panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionAuthProvider>{children}</SessionAuthProvider>
      </body>
    </html>
  );
}
