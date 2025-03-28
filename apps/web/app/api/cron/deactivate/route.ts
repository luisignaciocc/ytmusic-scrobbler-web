import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  await prisma.user.updateMany({
    where: {
      lastSuccessfulScrobble: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    data: {
      isActive: false,
    },
  });

  return new Response("Deactivated users");
}
