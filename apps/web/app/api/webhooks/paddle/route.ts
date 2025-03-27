/* eslint-disable no-console */
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

// Define interfaces for various Paddle data structures
interface PaddleSubscriptionData {
  id?: string;
  subscriptionId?: string;
  subscription_id?: string;
}

console.log("Initializing Paddle webhook handler");
const prisma = new PrismaClient();

function getPaddleInstance() {
  // eslint-disable-next-line no-console
  console.log("Getting Paddle instance");

  const paddleOptions: PaddleOptions = {
    environment:
      (process.env.NEXT_PUBLIC_PADDLE_ENV as Environment) ??
      Environment.sandbox,
    logLevel: LogLevel.error,
  };

  // eslint-disable-next-line no-console
  console.log("Paddle environment:", paddleOptions.environment);

  if (!process.env.PADDLE_API_KEY) {
    // eslint-disable-next-line no-console
    console.error("PADDLE_API_KEY is missing!");
    throw new Error("Paddle API key is missing");
  }

  return new Paddle(process.env.PADDLE_API_KEY!, paddleOptions);
}

class ProcessWebhook {
  async processEvent(eventData: EventEntity) {
    // eslint-disable-next-line no-console
    console.log("Processing webhook event:", eventData.eventType);
    // Safely log event data without assuming specific properties
    try {
      // eslint-disable-next-line no-console
      console.log("Event data:", JSON.stringify(eventData.data));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log("Could not stringify event data");
    }

    switch (eventData.eventType) {
      case EventName.SubscriptionCreated:
        // eslint-disable-next-line no-console
        console.log("Subscription created event received");
        await this.updateSubscriptionData(eventData);
        break;
      case EventName.SubscriptionUpdated:
        // eslint-disable-next-line no-console
        console.log("Subscription updated event received");
        await this.updateSubscriptionData(eventData);
        break;
      case EventName.SubscriptionCanceled:
        // eslint-disable-next-line no-console
        console.log("Subscription canceled event received");
        await this.handleSubscriptionCancelled(eventData);
        break;
      case EventName.TransactionCompleted:
        // eslint-disable-next-line no-console
        console.log("Transaction completed event received");
        await this.handleTransactionCompleted(eventData);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log("Unhandled event type:", eventData.eventType);
        break;
    }
  }

  private async updateSubscriptionData(
    eventData: SubscriptionCreatedEvent | SubscriptionUpdatedEvent,
  ) {
    try {
      // eslint-disable-next-line no-console
      console.log(
        "Updating subscription data for subscription ID:",
        eventData.data.id,
      );

      // Attempt to find user email in custom data
      let userEmailFromCustomData: string | undefined;
      if (
        eventData.data.customData &&
        typeof eventData.data.customData === "object"
      ) {
        // Use safer property access with indexed type
        const customData = eventData.data.customData as {
          [key: string]: unknown;
        };
        if (typeof customData.userEmail === "string") {
          userEmailFromCustomData = customData.userEmail;
          // eslint-disable-next-line no-console
          console.log(
            "Found userEmail in customData:",
            userEmailFromCustomData,
          );
        }
      }

      // Find user with matching subscription ID
      let user = await prisma.user.findFirst({
        where: {
          subscriptionId: eventData.data.id,
        },
      });

      // eslint-disable-next-line no-console
      console.log("User found with subscription ID:", user ? user.id : "None");

      // If no user found with subscription ID, try to find by email from customData
      if (!user && userEmailFromCustomData) {
        user = await prisma.user.findUnique({
          where: {
            email: userEmailFromCustomData,
          },
        });
        // eslint-disable-next-line no-console
        console.log(
          "User found with email from customData:",
          user ? user.id : "None",
        );
      }

      // If still no user found, try to find by customer email from Paddle API
      if (!user && eventData.data.customerId && !userEmailFromCustomData) {
        try {
          // eslint-disable-next-line no-console
          console.log(
            "Looking up customer details for customer ID:",
            eventData.data.customerId,
          );

          const paddle = getPaddleInstance();
          const customer = await paddle.customers.get(
            eventData.data.customerId,
          );
          const customerEmail = customer.email;

          // eslint-disable-next-line no-console
          console.log("Found customer email from Paddle API:", customerEmail);

          if (customerEmail) {
            user = await prisma.user.findUnique({
              where: {
                email: customerEmail,
              },
            });
            // eslint-disable-next-line no-console
            console.log(
              "User found with email from Paddle API:",
              user ? user.id : "None",
            );
          }
        } catch (customerError) {
          // eslint-disable-next-line no-console
          console.error("Error fetching customer details:", customerError);
        }
      }

      if (!user) {
        // eslint-disable-next-line no-console
        console.error("No user found for subscription ID:", eventData.data.id);
        return;
      }

      // Get subscription end date if available
      let endDate: Date | undefined;
      if (eventData.data.currentBillingPeriod) {
        try {
          // eslint-disable-next-line no-console
          console.log(
            "Billing period data:",
            JSON.stringify(eventData.data.currentBillingPeriod),
          );

          // Try to extract date information safely
          // Since the exact fields might differ depending on Paddle API version
          const billingPeriod = eventData.data.currentBillingPeriod;
          if (typeof billingPeriod === "object" && billingPeriod !== null) {
            // Check for any date-like field that might contain the end date
            const possibleEndDateFields = [
              "endDate",
              "end_date",
              "ends_at",
              "endsAt",
            ];
            let foundEndDate = false;

            for (const field of possibleEndDateFields) {
              if (
                field in billingPeriod &&
                billingPeriod[field as keyof typeof billingPeriod]
              ) {
                const dateValue =
                  billingPeriod[field as keyof typeof billingPeriod];
                if (typeof dateValue === "string") {
                  endDate = new Date(dateValue);
                  foundEndDate = true;
                  // eslint-disable-next-line no-console
                  console.log(
                    `Using billing period end date from field ${field}:`,
                    endDate,
                  );
                  break;
                }
              }
            }

            if (!foundEndDate) {
              // Fallback: add 30 days
              endDate = new Date();
              endDate.setDate(endDate.getDate() + 30);
              // eslint-disable-next-line no-console
              console.log(
                "Using fallback end date (today + 30 days):",
                endDate,
              );
            }
          } else {
            // Another fallback
            endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);
            // eslint-disable-next-line no-console
            console.log(
              "Using fallback end date (today + 30 days) - no billing period object:",
              endDate,
            );
          }
        } catch (dateError) {
          // eslint-disable-next-line no-console
          console.error("Error parsing billing period date:", dateError);

          // Another fallback
          endDate = new Date();
          endDate.setDate(endDate.getDate() + 30);
          // eslint-disable-next-line no-console
          console.log("Using fallback end date after error:", endDate);
        }
      } else {
        // If no billing period is available at all
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        // eslint-disable-next-line no-console
        console.log(
          "No billing period available, using default end date:",
          endDate,
        );
      }

      // Determine subscription plan from product
      let subscriptionPlan = "free";
      if (eventData.data.items?.[0]?.price?.productId) {
        const productId = eventData.data.items[0].price.productId;
        // eslint-disable-next-line no-console
        console.log("Product ID from subscription:", productId);

        // You may need to adjust this mapping based on your product IDs
        subscriptionPlan = "pro";

        // eslint-disable-next-line no-console
        console.log("Setting subscription plan to:", subscriptionPlan);
      }

      // Handle scheduled changes
      let scheduledCancellation: Date | null | undefined;
      if (eventData.data.scheduledChange) {
        if (
          eventData.data.scheduledChange.action === "cancel" &&
          eventData.data.scheduledChange.effectiveAt
        ) {
          scheduledCancellation = new Date(
            eventData.data.scheduledChange.effectiveAt,
          );
          console.log("Scheduled cancellation found:", scheduledCancellation);
        }
      } else {
        // If scheduledChange is null, it means any scheduled changes were cancelled
        scheduledCancellation = null;
        console.log("Scheduled changes cancelled");
      }

      // Log update operation
      // eslint-disable-next-line no-console
      console.log("Updating user record with:", {
        subscriptionId: eventData.data.id,
        subscriptionStatus: eventData.data.status,
        subscriptionPlan,
        subscriptionEndDate: endDate,
        scheduledCancellationDate: scheduledCancellation,
      });

      const updateResult = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          subscriptionId: eventData.data.id,
          subscriptionStatus: eventData.data.status,
          subscriptionPlan,
          subscriptionEndDate: endDate,
          scheduledCancellationDate: scheduledCancellation,
        },
      });

      // eslint-disable-next-line no-console
      console.log("User updated successfully:", updateResult.id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating subscription data:", error);
    }
  }

  private async handleSubscriptionCancelled(eventData: EventEntity) {
    try {
      // eslint-disable-next-line no-console
      console.log("Handling subscription cancellation");

      // Safely access ID if it exists in the data
      let subscriptionId;
      try {
        // Try different ways to access the subscription ID
        if (eventData.data && typeof eventData.data === "object") {
          const subscriptionData = eventData.data as PaddleSubscriptionData;
          subscriptionId =
            subscriptionData.id ||
            subscriptionData.subscriptionId ||
            subscriptionData.subscription_id;
        }

        // eslint-disable-next-line no-console
        console.log("Subscription ID for cancellation:", subscriptionId);
      } catch (idError) {
        // eslint-disable-next-line no-console
        console.error("Error extracting subscription ID:", idError);
        return;
      }

      if (!subscriptionId) {
        // eslint-disable-next-line no-console
        console.error("No subscription ID found in cancellation event");
        return;
      }

      const updateResult = await prisma.user.updateMany({
        where: {
          subscriptionId: subscriptionId,
        },
        data: {
          subscriptionStatus: "cancelled",
          subscriptionPlan: "free",
          scheduledCancellationDate: null, // Clear the scheduled date once cancelled
        },
      });

      // eslint-disable-next-line no-console
      console.log(
        "Subscription cancelled, affected users:",
        updateResult.count,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error handling subscription cancellation:", error);
    }
  }

  private async handleTransactionCompleted(eventData: EventEntity) {
    try {
      // eslint-disable-next-line no-console
      console.log("Transaction completed event received");

      // Instead of stringify which might fail, log properties manually
      // eslint-disable-next-line no-console
      console.log("Transaction data available:", eventData.data ? "Yes" : "No");

      // Implement transaction handling if needed
      // This could be used to track payments, update billing records, etc.
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error handling transaction:", error);
    }
  }
}

const webhookProcessor = new ProcessWebhook();

export async function POST(request: NextRequest) {
  // eslint-disable-next-line no-console
  console.log("Paddle webhook received:", new Date().toISOString());

  const signature = request.headers.get("paddle-signature") || "";
  // eslint-disable-next-line no-console
  console.log("Paddle signature:", signature ? "Present" : "Missing");

  const rawRequestBody = await request.text();
  // For security, don't log the entire raw body in production
  // eslint-disable-next-line no-console
  console.log("Request body length:", rawRequestBody.length);

  const privateKey = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET || "";
  if (!privateKey) {
    // eslint-disable-next-line no-console
    console.error("PADDLE_NOTIFICATION_WEBHOOK_SECRET is missing!");
  }

  let status = 200;
  let eventName;
  try {
    if (signature && rawRequestBody) {
      // eslint-disable-next-line no-console
      console.log("Validating webhook signature");

      const paddle = getPaddleInstance();
      const eventData = await paddle.webhooks.unmarshal(
        rawRequestBody,
        privateKey,
        signature,
      );

      eventName = eventData?.eventType ?? "Unknown event";
      // eslint-disable-next-line no-console
      console.log("Signature valid, event type:", eventName);

      if (eventData) {
        await webhookProcessor.processEvent(eventData);
        // eslint-disable-next-line no-console
        console.log("Event processed successfully");
      } else {
        // eslint-disable-next-line no-console
        console.warn("No event data returned after validation");
      }
    } else {
      status = 400;
      // eslint-disable-next-line no-console
      console.error("Missing required webhook parameters");
    }
  } catch (e) {
    status = 500;
    // eslint-disable-next-line no-console
    console.error("Error processing webhook:", e);
  } finally {
    // eslint-disable-next-line no-console
    console.log("Webhook processing completed with status:", status);
  }

  return Response.json({ eventName, processed: status === 200 }, { status });
}
