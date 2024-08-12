import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      picture: true,
      email: true,
      lastFmUsername: true,
      isActive: true,
      lastSuccessfulScrobble: true,
      createdAt: true,
      deletedAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return users;
}
