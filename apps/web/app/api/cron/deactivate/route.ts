import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Without this the route was prerendered: it ran once, during the build,
// against the database, and every later call got that cached response. It now
// runs when called, so the caller must present CRON_SECRET: Vercel Cron sends
// it by itself, and the deploy script does on the server. With no secret
// configured nobody can call it.
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return (
    Boolean(secret) &&
    request.headers.get("authorization") === `Bearer ${secret}`
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

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
