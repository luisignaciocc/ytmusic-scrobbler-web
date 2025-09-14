import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

const isVercelProd = process.env.VERCEL_PROD_BUILD === 'true';

export default withSentryConfig(nextConfig, {
  org: "bocono",
  project: "ytmusic-scrobbler-web",
  silent: true,
  widenClientFileUpload: false,
  sourcemaps: { disable: !isVercelProd },
  disableLogger: true,
  automaticVercelMonitors: false,
  skipRelease: !isVercelProd,
});
