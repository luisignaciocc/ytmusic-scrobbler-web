import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  org: "bocono",
  project: "ytmusic-scrobbler-web",
  silent: true,
  widenClientFileUpload: false,
  sourcemaps: { disable: true },
  disableLogger: true,
  automaticVercelMonitors: false,
  skipRelease: true,
});
