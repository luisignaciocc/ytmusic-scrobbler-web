"use server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getUsers(
  page?: number,
  perPage?: number,
  searchText?: string,
  isActive?: boolean | string,
  sortColumn?: string,
  sortDirection?: string | undefined,
) {
  try {
    const limit = perPage || 10;
    const offset = ((page || 1) - 1) * limit;

    const where: any = {};

    const whereConditions: any = {};

    if (typeof isActive === "boolean") {
      whereConditions.isActive = isActive;
    }

    if (searchText) {
      whereConditions.OR = [
        { email: { contains: searchText } },
        { lastFmUsername: { contains: searchText } },
      ];
    }

    const orderBy: any = {};

    if (sortColumn && sortDirection) {
      orderBy[sortColumn] = sortDirection;
    } else {
      orderBy.createdAt = "desc";
    }

    const [users, count] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          picture: true,
          email: true,
          lastFmUsername: true,
          isActive: true,
          lastSuccessfulScrobble: true,
          createdAt: true,
          updatedAt: true,
          // Health indicators
          consecutiveFailures: true,
          lastFailureType: true,
          lastFailedAt: true,
          // Setup completion
          ytmusicCookie: true,
          lastFmSessionKey: true,
          // Subscription info
          subscriptionPlan: true,
          subscriptionStatus: true,
          // Notification settings
          notificationsEnabled: true,
          authNotificationCount: true,
          lastNotificationSent: true,
          // Song count
          Songs: {
            select: {
              id: true,
              addedAt: true,
            },
            take: 1,
            orderBy: {
              addedAt: 'desc'
            }
          },
          _count: {
            select: {
              Songs: true
            }
          }
        },
        where: whereConditions,
        orderBy: orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where: whereConditions }),
    ]);

    return {
      users,
      count,
    };
  } catch (error) {
    console.error("Error querying users:", error);
    throw error;
  }
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive: !isActive,
      },
    });

    return updatedUser.isActive;
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
}

export async function resetUserFailures(userId: string) {
  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        consecutiveFailures: 0,
        lastFailureType: null,
        lastFailedAt: null,
        authNotificationCount: 0,
        lastNotificationSent: null,
        isActive: true, // Reactivate user when failures are reset
      },
    });

    return updatedUser;
  } catch (error) {
    console.error("Error resetting user failures:", error);
    throw error;
  }
}
