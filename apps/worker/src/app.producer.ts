import { InjectQueue } from "@nestjs/bull";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Queue } from "bull";

import { PrismaService } from "./prisma.service";

@Injectable()
export class AppProducer implements OnModuleInit {
  constructor(
    @InjectQueue("scrobbler")
    private readonly queue: Queue,
    private readonly prisma: PrismaService,
  ) {}
  private readonly logger = new Logger(AppProducer.name);

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

  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: "scrobbleFreeUsers",
  })
  async scrobbleFreeUsers() {
    this.logger.debug("Processing free users (every 30 minutes)");
    await this.processUsersBySubscription("free", 60 * 30 * 1000);
  }

  private async processUsersBySubscription(
    subscriptionPlan: "pro" | "free",
    cronInterval: number,
  ) {
    const LAST_SCROBBLE_INTERVAL = new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 5,
    ); // 5 days

    const activeUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        subscriptionPlan,
        lastFmSessionKey: {
          not: null,
        },
        ytmusicCookie: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
      },
    });

    const count = activeUsers.length;

    if (count === 0) {
      return;
    }

    const equidistantInterval = cronInterval / count;

    this.queue.addBulk(
      activeUsers.map((user, index) => ({
        name: "scrobble",
        data: {
          userId: user.id,
        },
        opts: {
          delay: index * equidistantInterval,
          attempts: 1,
        },
      })),
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
