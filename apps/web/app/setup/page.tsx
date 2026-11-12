import { PrismaClient } from "@prisma/client";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import SetupWizard from "./setup-wizard";

export const metadata: Metadata = {
  title: "Connect YouTube Music",
  robots: { index: false },
};

const prisma = new PrismaClient();

/** Guide for copying the YouTube Music cookie, and the form that saves it. */
export default async function SetupPage() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { ytmusicCookie: true },
  });
  if (!user) redirect("/");

  return <SetupWizard isUpdate={Boolean(user.ytmusicCookie)} />;
}
