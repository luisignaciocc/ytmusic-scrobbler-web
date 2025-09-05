"use server";
import { Prisma, PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export const toggleScrobble = async (scrobble: boolean) => {
  try {
    const session = await getServerSession();

    const userEmail = session?.user?.email;

    if (!userEmail) {
      return false;
    }

    // If activating scrobbling, check if we should set first-time ready flag
    const updateData: Prisma.UserUpdateInput = {
      isActive: scrobble,
      updatedAt: new Date(),
    };

    if (scrobble) {
      // Get current user state to determine if this is activation/reactivation
      const currentUser = await prisma.user.findUnique({
        where: { email: userEmail },
        select: {
          isActive: true,
          lastSuccessfulScrobble: true,
          subscriptionPlan: true,
        },
      });

      // Set first-time ready flag if:
      // 1. User is currently inactive (reactivation) OR
      // 2. User has never scrobbled successfully (first activation)
      // 3. User is not Pro (Pro users don't need this flag)
      if (
        currentUser &&
        currentUser.subscriptionPlan !== "pro" &&
        (!currentUser.isActive || !currentUser.lastSuccessfulScrobble)
      ) {
        updateData.isFirstTimeReady = true;
      }
    } else {
      // When deactivating, reset the flag
      updateData.isFirstTimeReady = false;
    }

    await prisma.user.update({
      where: {
        email: userEmail,
      },
      data: updateData,
    });
  } catch (error) {
    return false;
  }
};

export const updateNotificationPreferences = async (
  notificationEmail: string,
  notificationsEnabled: boolean,
) => {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return { success: false, error: "Not authenticated" };
    }

    await prisma.user.update({
      where: {
        email: userEmail,
      },
      data: {
        notificationEmail,
        notificationsEnabled,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return { success: false, error: "Failed to update preferences" };
  }
};

export const toggleNotifications = async (enabled: boolean) => {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return { success: false, error: "Not authenticated" };
    }

    await prisma.user.update({
      where: {
        email: userEmail,
      },
      data: {
        notificationsEnabled: enabled,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error toggling notifications:", error);
    return { success: false, error: "Failed to update notification status" };
  }
};
