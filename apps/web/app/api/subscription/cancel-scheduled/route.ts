import { Environment, Paddle, PaddleOptions } from "@paddle/paddle-node-sdk";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

function getPaddleInstance() {
  const paddleOptions: PaddleOptions = {
    environment:
      (process.env.NEXT_PUBLIC_PADDLE_ENV as Environment) ??
      Environment.sandbox,
  };

  if (!process.env.PADDLE_API_KEY) {
    console.error("PADDLE_API_KEY is missing!");
    throw new Error("Paddle API key is missing");
  }

  return new Paddle(process.env.PADDLE_API_KEY!, paddleOptions);
}

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

    if (!user.scheduledCancellationDate) {
      return NextResponse.json(
        { error: "No scheduled cancellation found" },
        { status: 400 },
      );
    }

    // Cancel the scheduled cancellation through Paddle API
    const paddle = getPaddleInstance();
    await paddle.subscriptions.update(user.subscriptionId, {
      scheduledChange: null, // This removes any scheduled changes
    });

    return NextResponse.json({
      success: true,
      message:
        "Scheduled cancellation has been cancelled. Your subscription will continue as normal.",
    });
  } catch (error) {
    console.error("Error cancelling scheduled cancellation:", error);
    return NextResponse.json(
      { error: "Failed to cancel scheduled cancellation" },
      { status: 500 },
    );
  }
}
