import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

import ScrobbleBtnClient from "./scrobble-button-client";

const prisma = new PrismaClient();

export default async function ScrobbleBtnServer() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  if (!user) {
    return null;
  }

  if (!user.ytmusicCookie || !user.ytmusicAuthUser) {
    return (
      <div className="text-center max-w-md">
        Please add your YouTube Music headers to start scrobbling. Follow the
        instructions above to get them from your browser.
      </div>
    );
  }

  if (!user.lastFmSessionKey) {
    // on localhost, we need to add the param cb=http://localhost:3000/api/callback/lastfm to the url
    const isLocalHost =
      process.env.VERCEL_ENV !== "production" &&
      process.env.VERCEL_ENV !== "preview";
    const url = `https://www.last.fm/api/auth/?api_key=${process.env.LAST_FM_API_KEY}${
      isLocalHost ? "&cb=http://localhost:3000/api/callback/lastfm" : ""
    }`;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
      >
        To start scrobbling, please authorize on Last.fm
      </a>
    );
  }

  return <ScrobbleBtnClient scrobbling={user.isActive} />;
}
