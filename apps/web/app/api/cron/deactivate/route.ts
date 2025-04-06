import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  await prisma.user.updateMany({
    where: {
      OR: [
        {
          lastSuccessfulScrobble: {
            lt: sevenDaysAgo,
          },
        },
        {
          lastSuccessfulScrobble: null,
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
      ],
    },
    data: {
      isActive: false,
    },
  });

  return new Response("Deactivated users");
}
