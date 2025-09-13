import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

// Make sure adding Sentry options is the last code to run before exporting
export default withSentryConfig(nextConfig, {
  org: "ytmusic-scrobbler",
  project: "web",

  // An auth token is required for uploading source maps.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: false, // Can be used to suppress logs

  widenClientFileUpload: true, // Upload a larger set of source maps for prettier stack traces (increases build time)
  reactComponentAnnotation: {
    enabled: true, // Annotate React components to show their full name in breadcrumbs and session replay
  },

  hideSourceMaps: true, // Hides source maps from generated client bundles
  disableLogger: true, // Automatically tree-shake Sentry logger statements to reduce bundle size
  automaticVercelMonitors: true, // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
});
