import { PrismaClient } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button";
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
          className={buttonVariants({ variant: "outline", size: "lg" })}
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
      className={buttonVariants({ variant: "primary", size: "lg" })}
    >
      Authorize on Last.fm
    </a>
  );
}
