import { InjectQueue } from "@nestjs/bull";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Queue } from "bull";

import { PrismaService } from "./prisma.service";

interface UserWithFailureInfo {
  id: string;
  consecutiveFailures: number;
  lastFailureType: string | null;
  lastFailedAt: Date | null;
  lastSuccessfulScrobble: Date | null;
  subscriptionPlan: string;
  isFirstTimeReady: boolean;
}

@Injectable()
export class AppProducer implements OnModuleInit {
  constructor(
    @InjectQueue("scrobbler")
    private readonly queue: Queue,
    private readonly prisma: PrismaService,
  ) {}
  private readonly logger = new Logger(AppProducer.name);

  private filterUsersWithCircuitBreaker(
    users: UserWithFailureInfo[],
  ): UserWithFailureInfo[] {
    const now = new Date();

    return users.filter((user) => {
      // Users with no failures are always processed
      if (user.consecutiveFailures === 0 || !user.lastFailedAt) {
        return true;
      }

      // Calculate cooldown period based on failure type and count
      const cooldownMinutes = this.calculateCooldownPeriod(
        user.lastFailureType,
        user.consecutiveFailures,
      );
      const cooldownMs = cooldownMinutes * 60 * 1000;
      const timeSinceLastFailure = now.getTime() - user.lastFailedAt.getTime();

      // Skip if still in cooldown
      if (timeSinceLastFailure < cooldownMs) {
        this.logger.debug(
          `User ${user.id} in cooldown for ${Math.round((cooldownMs - timeSinceLastFailure) / 1000 / 60)} more minutes`,
        );
        return false;
      }

      return true;
    });
  }

  private calculateCooldownPeriod(
    failureType: string | null,
    consecutiveFailures: number,
  ): number {
    const baseMinutes = {
      AUTH: 30, // Auth errors get longer cooldowns since they're likely persistent
      NETWORK: 10, // Network errors might be temporary
      LASTFM: 15, // Last.fm errors are somewhere in between
      UNKNOWN: 20, // Unknown errors get moderate cooldown
    };

    const base =
      baseMinutes[failureType as keyof typeof baseMinutes] ||
      baseMinutes.UNKNOWN;

    // Exponential backoff: base * (2 ^ (failures - 1))
    // But cap at reasonable maximums
    const multiplier = Math.min(Math.pow(2, consecutiveFailures - 1), 8); // Cap at 8x
    const cooldown = base * multiplier;

    // Cap total cooldown based on failure type
    const maxCooldown = {
      AUTH: 240, // 4 hours max for auth errors
      NETWORK: 60, // 1 hour max for network errors
      LASTFM: 120, // 2 hours max for Last.fm errors
      UNKNOWN: 180, // 3 hours max for unknown errors
    };

    return Math.min(
      cooldown,
      maxCooldown[failureType as keyof typeof maxCooldown] ||
        maxCooldown.UNKNOWN,
    );
  }

  private calculateUserPriority(user: UserWithFailureInfo): number {
    // Higher numbers = higher priority (processed first)
    
    // Pro users get significant priority boost
    const subscriptionBonus = user.subscriptionPlan === "pro" ? 200 : 0;
    
    // Users with fewer failures get higher priority
    const failurePenalty = user.consecutiveFailures * 10;

    // Users with recent successful scrobbles get slight priority boost
    let successBonus = 0;
    if (user.lastSuccessfulScrobble) {
      const daysSinceSuccess =
        (Date.now() - user.lastSuccessfulScrobble.getTime()) /
        (1000 * 60 * 60 * 24);
      successBonus = Math.max(0, 20 - daysSinceSuccess); // Bonus decreases over time
    }

    // Base priority is 100 for free users, 300 for pro users, then adjust
    return Math.max(1, 100 + subscriptionBonus - failurePenalty + successBonus);
  }

  private calculateExponentialBackoff(user: UserWithFailureInfo): number {
    // Add additional delay for users with recent failures
    if (user.consecutiveFailures === 0) return 0;

    // Add 30 seconds per consecutive failure, up to 5 minutes max
    const additionalDelay = Math.min(
      user.consecutiveFailures * 30 * 1000,
      5 * 60 * 1000,
    );

    this.logger.debug(
      `User ${user.id} getting additional ${additionalDelay / 1000}s delay due to ${user.consecutiveFailures} consecutive failures`,
    );

    return additionalDelay;
  }

  async onModuleInit() {
    this.logger.debug(`connecting to prisma...`);
    await this.prisma.$connect();
    this.logger.debug(`connected`);
  }

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: "scrobbleProUsers",
  })
  async scrobbleProUsers() {
    this.logger.debug("Processing pro users (every 5 minutes)");
    await this.processUsersBySubscription("pro", 60 * 5 * 1000);
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: "scrobbleFreeUsers",
  })
  async scrobbleFreeUsers() {
    this.logger.debug("Processing free users (every hour)");
    await this.processUsersBySubscription("free", 60 * 60 * 1000);
  }

  private async processUsersBySubscription(
    subscriptionPlan: "pro" | "free",
    cronInterval: number,
  ) {
    const LAST_SCROBBLE_INTERVAL = new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 5,
    ); // 5 days

    // For Pro cycle: include Pro users + Free users ready for first-time processing
    // For Free cycle: only Free users (excluding those with isFirstTimeReady to avoid double processing)
    const whereCondition = subscriptionPlan === "pro" ? {
      isActive: true,
      OR: [
        { subscriptionPlan: "pro" },
        { subscriptionPlan: "free", isFirstTimeReady: true }
      ],
      lastFmSessionKey: {
        not: null,
      },
      ytmusicCookie: {
        not: null,
      },
    } : {
      isActive: true,
      subscriptionPlan: "free",
      isFirstTimeReady: false, // Exclude first-time ready users (they get processed in Pro cycle)
      lastFmSessionKey: {
        not: null,
      },
      ytmusicCookie: {
        not: null,
      },
    };

    const activeUsers = await this.prisma.user.findMany({
      where: whereCondition,
      orderBy: [
        { consecutiveFailures: "asc" }, // Process users with fewer failures first
        { lastSuccessfulScrobble: "desc" }, // Then by most recent successful scrobbles
        { createdAt: "asc" }, // Finally by account age
      ],
      select: {
        id: true,
        consecutiveFailures: true,
        lastFailureType: true,
        lastFailedAt: true,
        lastSuccessfulScrobble: true,
        subscriptionPlan: true,
        isFirstTimeReady: true,
      },
    });

    if (activeUsers.length === 0) {
      this.logger.debug(`No active ${subscriptionPlan} users found`);
      return;
    }

    // Filter users based on circuit breaker logic
    const usersToProcess = this.filterUsersWithCircuitBreaker(activeUsers);
    const count = usersToProcess.length;

    if (count === 0) {
      this.logger.debug(
        `All ${subscriptionPlan} users are in circuit breaker cooldown`,
      );
      return;
    }

    // For Pro cycle, show breakdown of Pro vs first-time Free users
    if (subscriptionPlan === "pro") {
      const proUsers = usersToProcess.filter(u => u.subscriptionPlan === "pro").length;
      const firstTimeFreeUsers = usersToProcess.filter(u => u.subscriptionPlan === "free" && u.isFirstTimeReady).length;
      
      this.logger.debug(
        `Processing ${count} users: ${proUsers} pro + ${firstTimeFreeUsers} first-time free (${activeUsers.length - count} skipped due to circuit breaker)`,
      );
    } else {
      this.logger.debug(
        `Processing ${count}/${activeUsers.length} ${subscriptionPlan} users (${activeUsers.length - count} skipped due to circuit breaker)`,
      );
    }

    const equidistantInterval = cronInterval / count;

    this.queue.addBulk(
      usersToProcess.map((user, index) => {
        const delay = index * equidistantInterval;
        const priority = this.calculateUserPriority(user);
        const additionalDelay = this.calculateExponentialBackoff(user);

        return {
          name: "scrobble",
          data: {
            userId: user.id,
          },
          opts: {
            delay: delay + additionalDelay,
            attempts: 1,
            priority,
          },
        };
      }),
    );

    await this.prisma.user.updateMany({
      data: {
        isActive: false,
      },
      where: {
        subscriptionPlan,
        OR: [
          {
            ytmusicCookie: null,
          },
          {
            lastFmSessionKey: null,
          },
          {
            lastSuccessfulScrobble: {
              lt: LAST_SCROBBLE_INTERVAL,
            },
          },
        ],
      },
    });
  }
}
