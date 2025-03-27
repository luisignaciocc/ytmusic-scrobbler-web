import "./globals.css";

import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import Header from "./components/header";
import ImplementationNotice from "./components/implementation-notice";
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
        <SessionAuthProvider>
          <div className="flex flex-col min-h-[100dvh]">
            <Header />
            <div className="container mx-auto px-4 mt-2">{children}</div>
          </div>
          <ImplementationNotice />
        </SessionAuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL("https://scrobbler.bocono-labs.com"),
  title: "Last.fm Scrobbler for YouTube Music",
  description:
    "Automatically track your listening activity on YouTube Music with Last.fm",
  openGraph: {
    type: "website",
    title: "Last.fm Scrobbler for YouTube Music",
    url: "https://scrobbler.bocono-labs.com",
    description:
      "Automatically track your listening activity on YouTube Music with Last.fm",
    siteName: "Last.fm Scrobbler for YouTube Music",
    images: [{ url: "/icon.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Last.fm Scrobbler for YouTube Music",
    description:
      "Automatically track your listening activity on YouTube Music with Last.fm",
    creator: "@luisignaciocc",
    images: `/icon.png`,
  },
};
