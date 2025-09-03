import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [
      totalUsers,
      activeUsers,
      usersWithRecentScrobbles,
      totalScrobbles,
      recentScrobbles
    ] = await Promise.all([
      // Total registered users
      prisma.user.count({
        where: {
          deletedAt: null
        }
      }),
      
      // Active users (have cookie and lastfm session)
      prisma.user.count({
        where: {
          deletedAt: null,
          isActive: true,
          ytmusicCookie: { not: null },
          lastFmSessionKey: { not: null }
        }
      }),
      
      // Users with scrobbles in last month
      prisma.user.count({
        where: {
          deletedAt: null,
          lastSuccessfulScrobble: {
            gte: oneMonthAgo
          }
        }
      }),
      
      // Total scrobbles
      prisma.song.count(),
      
      // Recent scrobbles (last month)
      prisma.song.count({
        where: {
          addedAt: {
            gte: oneMonthAgo
          }
        }
      })
    ]);

    return NextResponse.json({
      totalUsers,
      activeUsers,
      usersWithRecentScrobbles,
      totalScrobbles,
      recentScrobbles,
      inactiveUsers: totalUsers - activeUsers,
      usersWithoutRecentScrobbles: totalUsers - usersWithRecentScrobbles
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}