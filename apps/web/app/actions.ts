"use server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export const toggleScrobble = async (scrobble: boolean) => {
  try {
    const session = await getServerSession();

    const userEmail = session?.user?.email;

    if (!userEmail) {
      return false;
    }

    await prisma.user.update({
      where: {
        email: userEmail,
      },
      data: {
        isActive: scrobble,
      },
    });
  } catch (error) {
    return false;
  }
};
