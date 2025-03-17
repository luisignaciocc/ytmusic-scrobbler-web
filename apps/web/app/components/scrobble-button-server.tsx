import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

import ScrobbleBtnClient from "./scrobble-button-client";
import YouTubeHeadersForm from "./youtube-headers-form";

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

  const lastSuccessfulScrobble = user.lastSuccessfulScrobble
    ? new Date(user.lastSuccessfulScrobble)
    : null;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <ScrobbleBtnClient scrobbling={user.isActive} />
        <div className="flex items-center gap-2">
          <YouTubeHeadersForm
            buttonText="Update Connection"
            buttonClassName="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
          />
        </div>
      </div>

      {user.isActive && (
        <div className="text-sm space-y-2 mt-4">
          {lastSuccessfulScrobble && (
            <div>
              <span className="font-medium">Last Successful Scrobble:</span>{" "}
              {formatTimeAgo(lastSuccessfulScrobble)}
            </div>
          )}
          <div className="text-gray-500 text-xs">
            If scrobbling stops working, try updating your connection using the
            button above.
          </div>
        </div>
      )}
    </div>
  );
}
