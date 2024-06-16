import { PrismaClient } from "@prisma/client";

import getServerSession from "@/lib/get-server-session";

const prisma = new PrismaClient();

export default async function LastfmBtn() {
  const session = await getServerSession();

  const { LAST_FM_API_KEY } = process.env;

  const userEmail = session?.user?.email;

  if (!LAST_FM_API_KEY || !userEmail) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: userEmail,
    },
  });

  if (!user) {
    return null;
  }

  if (user.lastFmSessionKey) {
    return (
      user.lastFmUsername && (
        <a
          href={`https://www.last.fm/user/${user.lastFmUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
        >
          last.fm/{user.lastFmUsername}
        </a>
      )
    );
  }

  // on localhost, we need to add the param cb=http://localhost:3000/api/callback/lastfm to the url
  const isLocalHost =
    process.env.VERCEL_ENV !== "production" &&
    process.env.VERCEL_ENV !== "preview";
  const url = `https://www.last.fm/api/auth/?api_key=${LAST_FM_API_KEY}${
    isLocalHost ? "&cb=http://localhost:3000/api/callback/lastfm" : ""
  }`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
    >
      Authorize on Last.fm
    </a>
  );
}
