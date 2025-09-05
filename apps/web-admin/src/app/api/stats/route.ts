import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-client';

export async function GET() {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [
      totalUsers,
      activeUsers,
      usersWithRecentScrobbles24h,
      usersWithRecentScrobbles7d,
      usersWithRecentScrobbles30d,
      totalScrobbles,
      recentScrobbles24h,
      recentScrobbles7d,
      recentScrobbles30d,
      usersWithAuthFailures,
      usersWithNetworkFailures,
      usersWithoutCookie,
      usersWithoutLastFm,
      usersCreatedToday,
      usersCreatedThisWeek,
      avgScrobblesPerActiveUser,
      topArtists,
      failureStats
    ] = await Promise.all([
      // Basic user counts
      prisma.user.count({ where: { deletedAt: null } }),
      
      prisma.user.count({
        where: {
          deletedAt: null,
          isActive: true,
          ytmusicCookie: { not: null },
          lastFmSessionKey: { not: null }
        }
      }),

      // Users with recent activity (different timeframes)
      prisma.user.count({
        where: {
          deletedAt: null,
          lastSuccessfulScrobble: { gte: oneDayAgo }
        }
      }),

      prisma.user.count({
        where: {
          deletedAt: null,
          lastSuccessfulScrobble: { gte: oneWeekAgo }
        }
      }),

      prisma.user.count({
        where: {
          deletedAt: null,
          lastSuccessfulScrobble: { gte: oneMonthAgo }
        }
      }),
      
      // Scrobble counts
      prisma.song.count(),
      
      prisma.song.count({
        where: { addedAt: { gte: oneDayAgo } }
      }),

      prisma.song.count({
        where: { addedAt: { gte: oneWeekAgo } }
      }),

      prisma.song.count({
        where: { addedAt: { gte: oneMonthAgo } }
      }),

      // Failure analysis
      prisma.user.count({
        where: {
          deletedAt: null,
          lastFailureType: 'AUTH',
          consecutiveFailures: { gt: 0 }
        }
      }),

      prisma.user.count({
        where: {
          deletedAt: null,
          lastFailureType: { in: ['NETWORK', 'TEMPORARY'] },
          consecutiveFailures: { gt: 0 }
        }
      }),

      // Setup completeness
      prisma.user.count({
        where: {
          deletedAt: null,
          ytmusicCookie: null
        }
      }),

      prisma.user.count({
        where: {
          deletedAt: null,
          lastFmSessionKey: null
        }
      }),

      // Growth metrics
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: oneDayAgo }
        }
      }),

      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: oneWeekAgo }
        }
      }),

      // Average scrobbles per active user
      prisma.song.aggregate({
        _avg: { id: true },
        where: {
          user: {
            deletedAt: null,
            isActive: true,
            lastSuccessfulScrobble: { gte: oneMonthAgo }
          }
        }
      }),

      // Top 5 most scrobbled artists
      prisma.song.groupBy({
        by: ['artist'],
        _count: { artist: true },
        orderBy: { _count: { artist: 'desc' } },
        take: 5,
        where: {
          addedAt: { gte: oneMonthAgo }
        }
      }),

      // Failure type breakdown
      prisma.user.groupBy({
        by: ['lastFailureType'],
        _count: { lastFailureType: true },
        where: {
          deletedAt: null,
          lastFailureType: { not: null },
          consecutiveFailures: { gt: 0 }
        }
      })
    ]);

    // Calculate growth rates
    const activeUserRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100) : 0;
    const recentActivityRate24h = totalUsers > 0 ? ((usersWithRecentScrobbles24h / totalUsers) * 100) : 0;
    const setupCompletionRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100) : 0;

    return NextResponse.json({
      // Basic metrics
      totalUsers,
      activeUsers,
      usersWithRecentScrobbles24h,
      usersWithRecentScrobbles7d,
      usersWithRecentScrobbles30d,
      totalScrobbles,
      recentScrobbles24h,
      recentScrobbles7d,
      recentScrobbles30d,

      // Health metrics
      usersWithAuthFailures,
      usersWithNetworkFailures,
      usersWithoutCookie,
      usersWithoutLastFm,

      // Growth metrics
      usersCreatedToday,
      usersCreatedThisWeek,

      // Calculated metrics
      inactiveUsers: totalUsers - activeUsers,
      usersWithoutRecentScrobbles24h: totalUsers - usersWithRecentScrobbles24h,
      activeUserRate: Math.round(activeUserRate * 100) / 100,
      recentActivityRate24h: Math.round(recentActivityRate24h * 100) / 100,
      setupCompletionRate: Math.round(setupCompletionRate * 100) / 100,

      // Insights
      avgScrobblesPerActiveUser: avgScrobblesPerActiveUser._avg.id || 0,
      topArtists: topArtists.map(a => ({ artist: a.artist, count: a._count.artist })),
      failureStats: failureStats.reduce((acc, f) => {
        acc[f.lastFailureType || 'UNKNOWN'] = f._count.lastFailureType;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}