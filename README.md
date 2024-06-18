# YouTube Music to Last.fm Scrobbler Monorepo

This monorepo, managed with `pnpm` and `turborepo`, contains two applications designed to create a Last.fm scrobbler using YouTube Music history. The solution operates on a server and supports multiple users.

## Overview

- **Web App**: Built with Next.js, handles authentication flows to obtain Google and Last.fm keys.
- **Server App**: Built with NestJS, runs a background process every 5 minutes to fetch YouTube Music history and send it to Last.fm. It uses `BullMQ` for worker processes. Additionally, it includes a dashboard for monitoring process status.

## Local Setup

### Prerequisites

- `pnpm` must be installed.
- A `docker-compose.yml` file is available to set up a PostgreSQL database.

### Environment Variables

You will need to set several environment variables to run the applications:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Obtain these by creating a Google Cloud application with OAuth 2.0 client IDs. Set the permissions to `YouTube Data API v3 (/auth/youtube)`, authorized origins to `http://localhost:3000`, and authorized redirect URIs to `http://localhost:3000/api/auth/callback/google`.
- `NEXTAUTH_SECRET`: A token for encrypting the session JSON.
- `LAST_FM_API_KEY` and `LAST_FM_API_SECRET`: Obtain these by creating an app on Last.fm.
- `DASHBOARD_PASSWORD`: The password for the admin user protecting the background processes dashboard.

### Running the Applications

1. **Database Migration**:

   ```bash
   pnpm migrate
   ```

2. **Start the Development Server for the Web App**:

   ```bash
   pnpm dev --filter web
   ```

3. **Start the Workers**:
   ```bash
   pnpm dev --filter worker
   ```

### Ports

- The web app runs on port `3000`.
- The background worker app runs on port `4000`.

## Architecture

### ORM

- Uses Prisma as the ORM.

### Worker Logic

- **Producer** (`app.producer.ts`): Sends messages to be executed every 5 minutes, fetching all active users from the database.
- **Consumer** (`app.consumer.ts`): Contains the code that performs the scrobbling.

### Web App

- Contains several buttons for authorizing Google and Last.fm.
- Displays some system information.

## Docker

- A `docker-compose.yml` file is provided to set up a PostgreSQL database.

## Additional Information

For detailed instructions on setting up Google and Last.fm applications, please refer to their respective documentation.

---

**Note**: Ensure all environment variables are correctly set before starting the applications.
