import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

import Dashboard from "./components/dashboard";
import Landing from "./components/landing";

const prisma = new PrismaClient();

async function getUser() {
  const session = await getServerSession();
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export default async function Home({
  searchParams,
}: {
  searchParams: { connected?: string };
}) {
  const user = await getUser();

  // Visitors and users still setting up see the landing page with their next
  // step marked; a user with everything connected sees their dashboard.
  if (!user) return <Landing step={1} />;
  if (!user.lastFmSessionKey) return <Landing step={2} />;
  if (!user.ytmusicCookie) return <Landing step={3} />;

  return <Dashboard user={user} justConnected={searchParams.connected === "1"} />;
}
