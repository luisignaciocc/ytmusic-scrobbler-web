"use server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface GetUsersFilters {
  page?: number;
  perPage?: number;
  searchText?: string;
  isActive?: boolean | string;
  subscription?: string;
  setup?: string;
  health?: string;
  activity?: string;
  dateRange?: string;
  notifications?: string;
  sortColumn?: string;
  sortDirection?: string;
}

export async function getEnhancedUsers(filters: GetUsersFilters) {
  try {
    const {
      page = 1,
      perPage = 10,
      searchText,
      isActive,
      subscription,
      setup,
      health,
      activity,
      dateRange,
      notifications,
      sortColumn,
      sortDirection
    } = filters;

    const limit = perPage;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any = {};

    // Basic active filter
    if (typeof isActive === "boolean") {
      whereConditions.isActive = isActive;
    }

    // Search filter
    if (searchText) {
      whereConditions.OR = [
        { email: { contains: searchText, mode: 'insensitive' } },
        { lastFmUsername: { contains: searchText, mode: 'insensitive' } },
        { name: { contains: searchText, mode: 'insensitive' } },
      ];
    }

    // Subscription filters
    if (subscription && subscription !== 'all') {
      switch (subscription) {
        case 'free':
          whereConditions.subscriptionPlan = { in: [null, 'free'] };
          break;
        case 'pro':
          whereConditions.subscriptionPlan = 'pro';
          break;
        case 'active_subscription':
          whereConditions.subscriptionStatus = { in: ['active', 'trialing'] };
          break;
        case 'canceled':
          whereConditions.subscriptionStatus = 'canceled';
          break;
        case 'trial':
          whereConditions.subscriptionStatus = 'trialing';
          break;
      }
    }

    // Setup completion filters
    if (setup && setup !== 'all') {
      switch (setup) {
        case 'complete':
          whereConditions.AND = [
            { ytmusicCookie: { not: null } },
            { lastFmSessionKey: { not: null } }
          ];
          break;
        case 'incomplete':
          whereConditions.OR = [
            { ytmusicCookie: null },
            { lastFmSessionKey: null }
          ];
          break;
        case 'no_cookie':
          whereConditions.ytmusicCookie = null;
          break;
        case 'no_lastfm':
          whereConditions.lastFmSessionKey = null;
          break;
      }
    }

    // Health status filters
    if (health && health !== 'all') {
      switch (health) {
        case 'healthy':
          whereConditions.AND = [
            ...(whereConditions.AND || []),
            { consecutiveFailures: { lte: 2 } },
            { 
              OR: [
                { lastFailureType: null },
                { lastFailedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // More than 7 days ago
              ]
            }
          ];
          break;
        case 'warnings':
          whereConditions.consecutiveFailures = { gte: 3, lte: 5 };
          break;
        case 'errors':
          whereConditions.consecutiveFailures = { gte: 6 };
          break;
        case 'auth_failures':
          whereConditions.lastFailureType = { contains: 'auth' };
          break;
        case 'network_failures':
          whereConditions.lastFailureType = { contains: 'network' };
          break;
      }
    }

    // Activity filters
    if (activity && activity !== 'all') {
      const now = new Date();
      switch (activity) {
        case 'recent':
          whereConditions.lastSuccessfulScrobble = {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          };
          break;
        case 'inactive_30d':
          whereConditions.OR = [
            { lastSuccessfulScrobble: null },
            { 
              lastSuccessfulScrobble: {
                lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // More than 30 days ago
              }
            }
          ];
          break;
        case 'no_scrobbles':
          whereConditions.lastSuccessfulScrobble = null;
          break;
        case 'high_activity':
          // This will be handled with a having clause in the query
          break;
      }
    }

    // Date range filters
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      switch (dateRange) {
        case 'today':
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          whereConditions.createdAt = { gte: startOfDay };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          whereConditions.createdAt = { gte: weekAgo };
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          whereConditions.createdAt = { gte: monthAgo };
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          whereConditions.createdAt = { gte: quarterAgo };
          break;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          whereConditions.createdAt = { gte: yearAgo };
          break;
        case 'older':
          const yearAgoForOlder = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          whereConditions.createdAt = { lt: yearAgoForOlder };
          break;
      }
    }

    // Notifications filters
    if (notifications && notifications !== 'all') {
      switch (notifications) {
        case 'enabled':
          whereConditions.notificationsEnabled = true;
          break;
        case 'disabled':
          whereConditions.notificationsEnabled = false;
          break;
        case 'high_notifications':
          whereConditions.authNotificationCount = { gte: 5 };
          break;
        case 'recent_notifications':
          const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          whereConditions.lastNotificationSent = { gte: recentDate };
          break;
      }
    }

    // Order by
    const orderBy: any = {};
    if (sortColumn && sortDirection) {
      orderBy[sortColumn] = sortDirection;
    } else {
      orderBy.createdAt = "desc";
    }

    // Execute query
    const [users, count] = await Promise.all([
      prisma.user.findMany({
        where: whereConditions,
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
              Songs: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.user.count({
        where: whereConditions,
      }),
    ]);

    // Filter high activity users if needed (since we can't do it in the query easily)
    let filteredUsers = users;
    if (activity === 'high_activity') {
      filteredUsers = users.filter(user => user._count.Songs >= 100);
    }

    return {
      users: filteredUsers,
      count: activity === 'high_activity' ? filteredUsers.length : count,
      totalPages: Math.ceil((activity === 'high_activity' ? filteredUsers.length : count) / limit),
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}