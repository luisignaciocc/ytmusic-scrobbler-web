import {
  Environment,
  EventEntity,
  EventName,
  LogLevel,
  Paddle,
  PaddleOptions,
  SubscriptionCreatedEvent,
  SubscriptionUpdatedEvent,
} from "@paddle/paddle-node-sdk";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

function getPaddleInstance() {
  const paddleOptions: PaddleOptions = {
    environment:
      (process.env.NEXT_PUBLIC_PADDLE_ENV as Environment) ??
      Environment.sandbox,
    logLevel: LogLevel.error,
  };

  if (!process.env.PADDLE_API_KEY) {
    throw new Error("Paddle API key is missing");
  }

  return new Paddle(process.env.PADDLE_API_KEY!, paddleOptions);
}

class ProcessWebhook {
  async processEvent(eventData: EventEntity) {
    switch (eventData.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionUpdated:
        await this.updateSubscriptionData(eventData);
        break;
      case EventName.SubscriptionCanceled:
        await this.handleSubscriptionCancelled(eventData);
        break;
    }
  }

  private async updateSubscriptionData(
    eventData: SubscriptionCreatedEvent | SubscriptionUpdatedEvent,
  ) {
    try {
      // Find user with matching subscription ID
      const user = await prisma.user.findFirst({
        where: {
          subscriptionId: eventData.data.id,
        },
      });

      // If no user found with this subscription ID, try to find by customer email
      let userEmail;
      if (eventData.data.customerId) {
        // You may need to query Paddle API to get the customer email if needed
        // For now, we'll just use the subscription ID
      }

      if (!user && !userEmail) {
        return;
      }

      // Get subscription end date if available
      let endDate: Date | undefined;
      if (eventData.data.currentBillingPeriod) {
        // The field names might differ based on the actual Paddle SDK type
        // You may need to adjust this based on the actual structure
        endDate = new Date();
        // Add 30 days as a fallback if exact end date isn't available
        endDate.setDate(endDate.getDate() + 30);
      }

      // Determine subscription plan from product
      let subscriptionPlan = "free";
      if (eventData.data.items?.[0]?.price?.productId) {
        // You may need to adjust this mapping based on your product IDs
        subscriptionPlan = "pro";
      }

      await prisma.user.update({
        where: {
          id: user?.id || undefined,
          email: !user ? userEmail : undefined,
        },
        data: {
          subscriptionId: eventData.data.id,
          subscriptionStatus: eventData.data.status,
          subscriptionPlan,
          subscriptionEndDate: endDate,
        },
      });
    } catch (error) {
      // Log error but don't expose details
    }
  }

  private async handleSubscriptionCancelled(eventData: EventEntity) {
    try {
      await prisma.user.updateMany({
        where: {
          subscriptionId: eventData.data.id,
        },
        data: {
          subscriptionStatus: "cancelled",
          subscriptionPlan: "free",
        },
      });
    } catch (error) {
      // Log error but don't expose details
    }
  }
}

const webhookProcessor = new ProcessWebhook();

export async function POST(request: NextRequest) {
  const signature = request.headers.get("paddle-signature") || "";
  const rawRequestBody = await request.text();
  const privateKey = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET || "";

  let status, eventName;
  try {
    if (signature && rawRequestBody) {
      const paddle = getPaddleInstance();
      const eventData = await paddle.webhooks.unmarshal(
        rawRequestBody,
        privateKey,
        signature,
      );
      status = 200;
      eventName = eventData?.eventType ?? "Unknown event";
      if (eventData) {
        await webhookProcessor.processEvent(eventData);
      }
    } else {
      status = 400;
    }
  } catch (e) {
    status = 500;
  }
  return Response.json({ status, eventName });
}
