> **⚠️ Alert: Unfortunately, the web authentication method used here is no longer allowed for accessing your YouTube Music listening history, so this service has stopped working. However, you can still use the [original project]([https://github.com/luisignaciocc/ytmusic-scrobbler-web](https://github.com/luisignaciocc/youtube-music-scrobbler)) if you want to scrobble your music history to Last.fm.**

# Last.fm Scrobbler for YouTube Music History

This repository is a monorepo managed by pnpm and Turborepo that consists of two applications:

- **Web App**: A Next.js application that handles authentication flows for obtaining Google and Last.fm API keys.
- **Background App**: A Nest.js application running on a server that runs a process every 5 minutes to fetch YouTube history and send it to Last.fm using Redis for message passing between the scheduler and the consumer.

## Features

- Scrobbles YouTube Music history to Last.fm
- Supports multiple users
- Web app for authentication and user management
- Background process for efficient scrobbling
- Dashboard to monitor background process status
- Uses Redis for inter-process communication

## Technology Stack

- **Frontend**: Next.js
- **Backend**: Nest.js, BullMQ
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Package Manager**: pnpm
- **Build System**: Turborepo
- **Message Broker**: Redis

## Local Setup

### Prerequisites

- pnpm installed
- Docker installed

### Environment Variables

- `GOOGLE_CLIENT_ID`: Obtain from creating a Google OAuth 2.0 client ID in Google Cloud Platform
- `GOOGLE_CLIENT_SECRET`: Obtain from creating a Google OAuth 2.0 client ID in Google Cloud Platform
- `NEXTAUTH_SECRET`: A token to encrypt the session JSON
- `LAST_FM_API_KEY`: Obtain from creating a Last.fm app
- `LAST_FM_API_SECRET`: Obtain from creating a Last.fm app
- `DASHBOARD_PASSWORD`: Password for the admin user to protect the background process dashboard

### Setup Steps

1. Clone the repository
2. Set the required environment variables
3. Run `docker-compose up -d` to start the PostgreSQL and Redis services
4. Run `pnpm migrate` to migrate the database
5. Run `pnpm dev --filter web` to start the frontend development server (port 3000)
6. Run `pnpm dev --filter worker` to start the background workers (port 4000)
7. Run `pnpm dev --filter web-admin` to start the admin frontend development server (port 3000)

## Usage

### Web App

- Navigate to `http://localhost:3000` in your browser
- Authorize Google and Last.fm access
- Enable and disable your scrobbling processes

### Dashboard

- Navigate to `http://localhost:4000/dashboard` in your browser
- Enter the `DASHBOARD_PASSWORD` to access the dashboard
- Monitor the status of background processes

## Development

- Make changes to the code in the respective directories (`web` for frontend, `worker` for background)
- Save changes
- The corresponding application will automatically reload in development mode

## Additional Notes

- The worker logic uses a producer-consumer pattern to efficiently handle scrobbling tasks with Redis as the message broker.
- The frontend provides buttons for authorizing Google and Last.fm access, as well as a button to start/stop scrobbling.

## Contributing

Contributions are welcome! Please follow the standard GitHub contribution guidelines.

## License

This project is licensed under the MIT License.
