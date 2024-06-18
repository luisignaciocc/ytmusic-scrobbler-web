import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

import SessionAuthProvider from "./components/session-provider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionAuthProvider>{children}</SessionAuthProvider>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: "YouTube Music Scrobbler",
  description:
    "Automatically track your listening activity on YouTube Music with Last.fm",
  openGraph: {
    type: "website",
    title: "YouTube Music Scrobbler",
    description:
      "Automatically track your listening activity on YouTube Music with Last.fm",
    siteName: "YouTube Music Scrobbler",
    images: [{ url: "/icon.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Music Scrobbler",
    description:
      "Automatically track your listening activity on YouTube Music with Last.fm",
    creator: "@luisignaciocc",
    images: `/icon.png`,
  },
};
