import { PrismaClient } from "@prisma/client";

import getServerSession from "@/lib/get-server-session";

import LastfmLogoutBtn from "./lastfm-logout-btn";

const prisma = new PrismaClient();

export default async function LastfmLogout() {
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

  const logoutLastFm = async () => {
    "use server";
    const prisma = new PrismaClient();
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastFmSessionKey: null,
        lastFmUsername: null,
      },
    });
  };

  if (!user.lastFmSessionKey) {
    return null;
  }

  return <LastfmLogoutBtn logoutLastFm={logoutLastFm} />;
}
