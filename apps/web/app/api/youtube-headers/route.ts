import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { cookie } = await request.json();

    if (!cookie) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        ytmusicCookie: cookie,
        lastNotificationSent: null,
        // Reset failure tracking and reactivate account when user updates credentials
        consecutiveFailures: 0,
        lastFailureType: null,
        lastFailedAt: null,
        authNotificationCount: 0,
        isActive: true, // Reactivate the account
      },
    });

    return new NextResponse("Headers saved successfully", { status: 200 });
  } catch (error) {
    console.error("Error saving headers:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
