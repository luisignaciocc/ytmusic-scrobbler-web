"use server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export const toggleScrobble = async (scrobble: boolean) => {
  try {
    const session = await getServerSession();

    const userEmail = session?.user?.email;

    if (!userEmail) {
      return false;
    }

    await prisma.user.update({
      where: {
        email: userEmail,
      },
      data: {
        isActive: scrobble,
        updatedAt: new Date(),
      },
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
