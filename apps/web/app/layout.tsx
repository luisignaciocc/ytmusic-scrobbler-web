import "./globals.css";

import * as Sentry from "@sentry/nextjs";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

import Footer from "./components/footer";
import Header from "./components/header";
import ImplementationNotice from "./components/implementation-notice";
import SessionAuthProvider from "./components/session-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${display.variable} font-sans`}>
        <SessionAuthProvider>
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
          >
            Skip to content
          </a>
          <div className="flex min-h-[100dvh] flex-col">
            <Header />
            <div id="content" className="flex-1">
              {children}
            </div>
            <Footer />
          </div>
          <ImplementationNotice />
        </SessionAuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

export function generateMetadata(): Metadata {
  return {
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
    other: {
      ...Sentry.getTraceData(),
    },
  };
}
