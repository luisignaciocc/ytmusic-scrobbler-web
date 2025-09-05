import { Prisma, PrismaClient } from "@prisma/client";
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

    // Get current user info to determine if we should set first-time ready flag
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { subscriptionPlan: true },
    });

    const updateData: Prisma.UserUpdateInput = {
      ytmusicCookie: cookie,
      // Reset failure tracking and reactivate account when user updates credentials
      consecutiveFailures: 0,
      lastFailureType: null,
      lastFailedAt: null,
      authNotificationCount: 0,
      lastNotificationSent: null, // Reset to quickly detect if new credentials have issues
      isActive: true, // Reactivate the account
    };

    // Set first-time ready flag for Free users (Pro users don't need immediate processing)
    if (currentUser && currentUser.subscriptionPlan !== "pro") {
      updateData.isFirstTimeReady = true;
    }

    await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: updateData,
    });

    return new NextResponse("Headers saved successfully", { status: 200 });
  } catch (error) {
    console.error("Error saving headers:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
