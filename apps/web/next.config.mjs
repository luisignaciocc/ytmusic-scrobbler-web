import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

// Disable Sentry webpack processing entirely during build to save memory
const isBuild = process.env.NODE_ENV === 'production' || process.argv.includes('build');

export default isBuild
  ? nextConfig // Skip Sentry entirely during builds
  : withSentryConfig(nextConfig, {
      org: "bocono",
      project: "ytmusic-scrobbler-web",
      silent: true,
      widenClientFileUpload: false,
      sourcemaps: { disable: true },
      disableLogger: true,
      automaticVercelMonitors: false,
      skipRelease: true,
    });
