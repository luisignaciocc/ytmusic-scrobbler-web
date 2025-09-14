import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

const isVercelProd = process.env.VERCEL_PROD_BUILD === "true";

// Only use Sentry for production builds (Vercel prod or VPS)
const useSentry =
  isVercelProd ||
  (!process.env.VERCEL && process.env.NODE_ENV === "production");

export default useSentry
  ? withSentryConfig(nextConfig, {
      org: "bocono",
      project: "ytmusic-scrobbler-web",
      silent: true,
      widenClientFileUpload: false,
      sourcemaps: { disable: !isVercelProd },
      disableLogger: true,
      automaticVercelMonitors: false,
      skipRelease: !isVercelProd,
      release: {
        name:
          process.env.NEXT_PUBLIC_SENTRY_RELEASE ||
          process.env.SENTRY_RELEASE ||
          process.env.VERCEL_GIT_COMMIT_SHA,
      },
    })
  : nextConfig;
