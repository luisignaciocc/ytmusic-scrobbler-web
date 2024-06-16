import { PrismaClient } from "@prisma/client";

import getServerSession from "@/lib/get-server-session";

import ScrobbleBtnClient from "./scrobble-button-client";

const prisma = new PrismaClient();

export default async function ScrobbleBtnServer() {
  const session = await getServerSession();

  const userEmail = session?.user?.email;

  if (!userEmail) {
    return (
      <button
        disabled
        className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
      >
        Once you sign in, you can start scrobbling
      </button>
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email: userEmail,
    },
  });

  if (!user || !user.googleAccessToken) {
    return (
      <button
        disabled
        className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
      >
        To start scrobbling, please sign out and sign in again
      </button>
    );
  }

  if (!user.googleRefreshToken) {
    return (
      <div className="text-center max-w-md">
        An error ocurred while trying to connect to your Google account, please
        go to{" "}
        <a
          href="https://myaccount.google.com/connections"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-500"
        >
          myaccount.google.com/connections
        </a>{" "}
        and remove the Youtube Music Scrobbler from the list of connected apps.
        Then, try to login again.
      </div>
    );
  }

  if (!user.lastFmSessionKey) {
    return (
      <button
        disabled
        className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
      >
        To start scrobbling, please authorize on Last.fm
      </button>
    );
  }

  return <ScrobbleBtnClient scrobbling={user.isActive} />;
}
