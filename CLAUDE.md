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