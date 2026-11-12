import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { cancelAtPeriodEnd } from "@/lib/billing/provider";

const prisma = new PrismaClient();

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.subscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 },
      );
    }

    // Keeps access until the paid period ends, on whichever provider bills it
    const change = await cancelAtPeriodEnd(user);
    // Stored now rather than when the provider's webhook arrives, so the
    // page (and any reload) shows the cancellation immediately.
    const subscription = await prisma.user.update({
      where: { id: user.id },
      data: change,
      select: {
        subscriptionId: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEndDate: true,
        scheduledCancellationDate: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscription,
      message:
        "Subscription successfully cancelled. Your access will continue until the end of your billing period.",
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}
