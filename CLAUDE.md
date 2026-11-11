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
- Worker app includes prebuild step that runs migrations in production

## Production Deployment

**The live site is served from a VPS, not from Vercel.** Vercel also builds every push, which makes it easy to look in the wrong place.

- **VPS (what users reach)**: nginx in front of two pm2 apps, `yt-music-scrobbler-web` (`next start`) and `yt-music-scrobbler-worker`, plus a local PostgreSQL and Redis. The repo is checked out at `~/ytmusic-scrobbler-web` and there is a single `.env` at its root (`apps/web/.env` is a symlink to it).
- **Vercel**: projects for `apps/web` and `apps/web-admin`. The admin dashboard is served from there. The `apps/web` build there is not what the public domain serves; the deploy workflow only waits for it to succeed before touching the VPS.
- **Deploy**: pushing to `master` runs `.github/workflows/deploy.yml`, which SSHes into the VPS, runs `git pull`, builds and restarts through pm2. The VPS pulls with a read-only deploy key registered on the GitHub repo.
- **Connection details** (host, SSH user, cloud project) are deliberately not in this public repo. They are in `CLAUDE.local.md`, which is git-ignored; if that file is missing, ask the maintainer.

### Things that will bite you

- **Environment variables for the web app and worker go in the VPS `.env`.** Setting them only in Vercel does nothing for the live site. `web-admin` reads its own from Vercel.
- **Never put a comment after a value in a `.env` file** (`KEY="x" // note`): dotenv keeps the comment as part of the value. Use `#` on its own line.
- **The VPS has 1 GB of RAM.** Building the web app while it is running exhausts memory and hangs the whole machine (it caused a multi-hour outage). The workflow therefore stops the web app during its build, so **every deploy that rebuilds the web app takes the site down for roughly 13 minutes**. Building by hand on the server: stop both pm2 apps first.
- **Merging to `master` deploys.** Changes under `apps/web/**`, `apps/worker/**`, `schema.prisma`, `migrations/**`, the lockfile or the workflow itself trigger it. Warn before merging.
- **A green deploy is only trustworthy since the workflow was fixed** to fail on a failed `git pull` or build. If the live site looks older than `master`, compare `git log` on the VPS with `origin/master`.
- **Migrations**: the VPS database is migrated by the worker's prebuild step; the Vercel build runs `prisma migrate deploy` against whatever `DATABASE_URL` Vercel has.

### Checking a deploy

```bash
gh run list --workflow deploy.yml --limit 3
curl -s -o /dev/null -w '%{http_code}\n' https://scrobbler.bocono-labs.com/pricing
```

On the VPS, `pm2 ls` shows both apps and `pm2 logs <app> --lines 50 --nostream` their output. pm2 and node are not on the default PATH of a non-interactive SSH session; see `CLAUDE.local.md` for the PATH to export.

## Billing

New subscriptions are billed through **Stripe**; subscriptions bought before the move stay on **Paddle** until they end. Both run side by side.

- `User.subscriptionProvider` (`paddle` | `stripe`, null = Paddle) says which provider owns `User.subscriptionId`. Provider-specific calls go through `apps/web/lib/billing/provider.ts`; never call a provider SDK directly from a route.
- Stripe: checkout at `POST /api/subscription/checkout`, webhook at `POST /api/webhooks/stripe` (events `checkout.session.completed` and `customer.subscription.created|updated|deleted|paused|resumed`). The webhook always re-reads the subscription from Stripe, under a lock, because events arrive unordered and overlapping. The Stripe → database mapping is in `apps/web/lib/billing/subscription-state.ts` and has unit tests.
- Paddle: webhook at `POST /api/webhooks/paddle`. It ignores events for users already on Stripe. Keep it and the Paddle server variables until no Paddle subscriptions remain.
- Statuses stored in `User.subscriptionStatus` use Paddle's spelling: `cancelled`, with two l's.
- Variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRODUCT_ID` (its default price is what gets charged; `STRIPE_PRICE_ID` optionally pins one), `STRIPE_MANAGED_PAYMENTS`. Secrets live only in the VPS `.env` and in Vercel's environment settings, never in the repo.

