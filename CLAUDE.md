# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `pnpm dev`: Start all applications in development mode
- `pnpm dev --filter web`: Start only the web app (Next.js, port 3000)  
- `pnpm dev --filter worker`: Start only the background worker (Nest.js, port 4000)
- `pnpm dev --filter web-admin`: Start only the admin dashboard (Next.js, port 8000)
- `pnpm build`: Build all applications
- `pnpm migrate`: Run Prisma database migrations
- `pnpm generate`: Generate Prisma client

### Code Quality
- `pnpm lint`: Run linting across all apps using Turbo
- `pnpm type-check`: Run TypeScript type checking across all apps
- `pnpm format`: Format code with Prettier and format Prisma schema

### Utility Scripts
- `pnpm get-history`: Run the YouTube Music history fetching script (requires .env.local)

### Troubleshooting
- **User Issues**: Always use `pnpm tsx -r dotenv/config scripts/get-history.ts <user-email>` for troubleshooting user-specific problems
  - Tests YouTube Music cookie validity and page parsing
  - Saves raw HTML and parsed data to files for inspection
  - Useful for diagnosing scrobbling issues or API changes

## Architecture Overview

This is a monorepo with three main applications:

### Applications Structure
- **apps/web**: Next.js frontend for user authentication and management
  - Handles YouTube Music header setup and Last.fm authorization
  - Uses NextAuth for authentication
  - Built with React, Tailwind CSS, and Radix UI components
  
- **apps/worker**: Nest.js background service for scrobbling
  - Scheduled tasks that run every 5 minutes to fetch YouTube history
  - Uses BullMQ for job queuing with Redis
  - Includes admin dashboard at `/dashboard` (protected by DASHBOARD_PASSWORD)
  - Producer-consumer pattern for efficient scrobbling

- **apps/web-admin**: Next.js admin interface
  - Separate admin dashboard running on port 8000
  - User management and monitoring capabilities

### Data Layer
- **Database**: PostgreSQL with Prisma ORM
- **Schema**: Located at root `schema.prisma`
- **Inactive users** (no successful scrobble in a week) are marked inactive by `GET /api/cron/deactivate`, which requires `Authorization: Bearer $CRON_SECRET`. The deploy script calls it after each web deploy when `CRON_SECRET` is in the VPS `.env`; nothing calls it on a schedule there.
- **Migrations**: Stored in `/migrations` directory
- **Message Queue**: Redis for job processing between scheduler and consumers

### Key Technologies
- **Package Manager**: pnpm with workspaces
- **Build System**: Turborepo for efficient builds and caching
- **Database**: PostgreSQL + Prisma
- **Queue System**: BullMQ + Redis
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Start services: `docker-compose up -d` (starts Redis)
3. Run migrations: `pnpm migrate`
4. Generate Prisma client: `pnpm generate`

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `LAST_FM_API_KEY` & `LAST_FM_API_SECRET`: From Last.fm API
- `NEXTAUTH_SECRET`: Session encryption token
- `DASHBOARD_PASSWORD`: Admin dashboard protection

## Development Workflow

- Each app has its own package.json with specific scripts
- Use Turbo commands at root for cross-app operations
- Database changes require running `pnpm generate` after schema updates
- The worker's `build` script runs migrations first (`prebuild`); production deploys call `nest build` directly and migrate from the deploy script

## Web UI conventions (apps/web)

- **Colours come from tokens** defined in `app/globals.css` (`bg-background`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-success`, `bg-warning-soft`...). Do not use fixed greys or `dark:` variants: the dark theme is those same tokens under `prefers-color-scheme`.
- Buttons and button-looking links use `buttonVariants` from `components/ui/button.ts`; inline messages use `components/ui/notice.tsx`. No `alert()`.
- **Text that changes while the page is open goes in `<DynamicText>`** (`components/ui/dynamic-text.tsx`), and a block that swaps its content gets a `key`. Chrome translates this English site for many visitors, which replaces text nodes; React then cannot update them (labels freeze) or crashes with `removeChild` when it removes one.
- The home page (`app/page.tsx`) shows `Landing` to visitors and to users still setting up, and `Dashboard` once Last.fm and the cookie are connected. The cookie guide is its own page, `/setup`; what users paste is checked by `lib/ytmusic-cookie.ts` on the client and again in the API.
- The free plan checks every **hour** and Pro every **5 minutes** (`apps/worker/src/app.producer.ts`); keep the copy in step with the worker.

## Dependencies

- `.github/dependabot.yml` opens one grouped pull request a week for minor and patch updates, one for security fixes, and separate ones for major versions.
- **Never declare a dependency as `*`.** `@prisma/client` was, and an update resolved it to a major version that no longer matched the `prisma` CLI, which removed every model from the generated client. It is pinned to the CLI's major; move both together.
- Known debt, each needing a deliberate migration: Next.js 14 is past its last patch (most open security alerts are fixed only in 15.5+), NestJS 10 (11 carries the fixes for its HTTP stack) and vitest 3.

## Production Deployment

**The live site is served from a VPS, not from Vercel.** Vercel also builds every push, which makes it easy to look in the wrong place.

- **VPS (what users reach)**: nginx in front of two pm2 apps, `yt-music-scrobbler-web` (`next start`) and `yt-music-scrobbler-worker`, plus a local PostgreSQL and Redis. The repo is checked out at `~/ytmusic-scrobbler-web` and there is a single `.env` at its root (`apps/web/.env` is a symlink to it).
- **Vercel**: projects for `apps/web` and `apps/web-admin`. The admin dashboard is served from there. The `apps/web` build there is not what the public domain serves; the deploy workflow does not depend on it.
- **Deploy**: pushing to `master` runs `.github/workflows/deploy.yml`. It builds the web app and the worker **on the GitHub runner**, uploads the finished builds to the VPS and pipes `scripts/deploy/server-deploy.sh` over SSH, which moves the checkout to that commit, installs dependencies, applies migrations, swaps the builds in and restarts through pm2. If the new web build does not answer, it puts the previous one back and the run fails. The VPS fetches with a read-only deploy key registered on the GitHub repo.
- **Connection details** (host, SSH user, cloud project) are deliberately not in this public repo. They are in `CLAUDE.local.md`, which is git-ignored; if that file is missing, ask the maintainer.

### Things that will bite you

- **Environment variables for the web app and worker go in the VPS `.env`.** Setting them only in Vercel does nothing for the live site. `web-admin` reads its own from Vercel.
- **Never put a comment after a value in a `.env` file** (`KEY="x" // note`): dotenv keeps the comment as part of the value. Use `#` on its own line.
- **The VPS has 1 GB of RAM: never build on it.** Building the web app there exhausts memory and hangs the whole machine (it caused a multi-hour outage), which is why builds happen on the runner. A deploy now costs the few seconds of a restart. If you ever must build by hand on the server, stop both pm2 apps first.
- **The build has no secrets and no database.** Nothing may run at build time that needs them: a route handler without request access gets prerendered, i.e. executed during the build (mark it `export const dynamic = "force-dynamic"`), and `process.env.NEXT_PUBLIC_*` is replaced by its build-time value even in server code (read it through a computed key, as `paddleEnvironment()` does, or it will be `undefined` in production).
- **Merging to `master` deploys.** Changes under `apps/web/**`, `apps/worker/**`, `schema.prisma`, `migrations/**`, the lockfile, `scripts/deploy/**`, `deploy/**` or the workflow itself trigger it.
- **A green deploy means the new builds passed their checks.** On the server: the web app serves `/` and `/pricing` and rejects unsigned webhook calls with 400, and the worker answers and does not restart by itself; a build that fails is replaced by the previous one. Then, from the runner, `scripts/monitor/external-check.sh` checks the site through nginx and TLS. If the live site looks older than `master`, compare `git log` on the VPS with `origin/master`.
- **Migrations**: the VPS database is migrated by the deploy script (`prisma migrate deploy`) on every deploy; the Vercel build runs `prisma migrate deploy` against whatever `DATABASE_URL` Vercel has.

### Maintenance and error pages

When the web app does not answer, nginx serves a static page instead of its bare "502 Bad Gateway" (always with status 503):

- `deploy/status-pages/maintenance.html` while a deploy is restarting the web app. The deploy script switches it on by creating `/var/www/scrobbler-status/maintenance.on.html` before the restart and removes it once the app answers again.
- `deploy/status-pages/error.html` at any other time, i.e. an outage nobody planned.

The nginx side is `deploy/status-pages/nginx-snippet.conf`, installed by hand on the VPS as `/etc/nginx/snippets/scrobbler-status.conf` and included from the site's server block; changing it means copying it there again and reloading nginx. The two pages are copied to the server by every deploy of the web app. Only errors produced by nginx are replaced; the app's own error responses pass through. The monitor fails if the maintenance page stays switched on for more than an hour.

### Checking a deploy

```bash
gh run list --workflow deploy.yml --limit 3
curl -s -o /dev/null -w '%{http_code}\n' https://scrobbler.bocono-labs.com/pricing
```

On the VPS, `pm2 ls` shows both apps and `pm2 logs <app> --lines 50 --nostream` their output. pm2 and node are not on the default PATH of a non-interactive SSH session; see `CLAUDE.local.md` for the PATH to export.

## Production Monitor

`.github/workflows/monitor.yml` runs once a day (and on demand from the Actions tab) and checks that production is healthy. The checks live in `scripts/monitor/` and only read:

- `external-check.sh` (on the GitHub runner): the site, pricing page, Stripe and Paddle webhooks, price endpoint, admin dashboard and TLS certificate.
- `server-check.sh` (piped to the VPS over SSH): nginx, PostgreSQL, Redis, both pm2 apps, the build on disk, memory, out-of-memory kills, disk and load.
- `subscriptions-check.cjs` (piped to the VPS, so it uses the server's own `.env`): recent scrobbling activity, Pro users past their paid period, Stripe and Paddle subscriptions compared with the database, and Stripe webhook deliveries.
- The workflow itself compares the commit deployed on the VPS with `master` for the paths that deploy.

**Outage alerts come from Google Cloud Monitoring**, not from GitHub: two uptime checks in the project that hosts the VPS request the site (every minute) and the worker (every 5 minutes) from several regions, and an alert policy for each emails the maintainer when a check fails from more than one region, and again on recovery. They live in the cloud console (Monitoring → Uptime checks / Alerting), not in this repo; `CLAUDE.local.md` has their names. They are the only thing that notices the whole server going down.

`.github/workflows/uptime.yml` is a backup for them. It is scheduled every 5 minutes, but GitHub runs it only a few times a day, so do not rely on it: `scripts/monitor/uptime-check.sh` requests the home page, the pricing page and the worker, and a target that fails twice, 90 seconds apart, opens an issue labelled `outage` that closes by itself on recovery. It can be tested from the Actions tab with `simulate_outage`.

The daily monitor, on a failure, opens an issue labelled `production-monitor`, or comments on the one already open; when everything passes again it closes it. Claude triages a newly opened issue: a pull request for a bug in this repo, a diagnosis with steps for anything else. It has no access to the server and never merges.

Every check prints `OK|WARN|FAIL <name> | <detail>`. That output is public (Actions logs and issues), so checks print states and counts only, never user data. To see which records a subscription check is counting, run it by hand on the VPS with `--verbose`:

```bash
cd ~/ytmusic-scrobbler-web/apps/web && node --env-file=../../.env - --verbose < ../../scripts/monitor/subscriptions-check.cjs
```

To add a check, print one more such line from the script that fits; the workflow picks it up without changes.

## Billing

New subscriptions are billed through **Stripe**; subscriptions bought before the move stay on **Paddle** until they end. Both run side by side.

- `User.subscriptionProvider` (`paddle` | `stripe`, null = Paddle) says which provider owns `User.subscriptionId`. Provider-specific calls go through `apps/web/lib/billing/provider.ts`; never call a provider SDK directly from a route.
- Stripe: checkout at `POST /api/subscription/checkout`, webhook at `POST /api/webhooks/stripe` (events `checkout.session.completed` and `customer.subscription.created|updated|deleted|paused|resumed`). The webhook always re-reads the subscription from Stripe, under a lock, because events arrive unordered and overlapping. The Stripe → database mapping is in `apps/web/lib/billing/subscription-state.ts` and has unit tests.
- Paddle: webhook at `POST /api/webhooks/paddle`. It ignores events for users already on Stripe. Keep it and the Paddle server variables until no Paddle subscriptions remain.
- Statuses stored in `User.subscriptionStatus` use Paddle's spelling: `cancelled`, with two l's.
- Variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRODUCT_ID` (its default price is what gets charged; `STRIPE_PRICE_ID` optionally pins one), `STRIPE_MANAGED_PAYMENTS`. Secrets live only in the VPS `.env` and in Vercel's environment settings, never in the repo.

