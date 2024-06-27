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
    name: "scrobble",
  })
  async scrobble() {
    const LAST_SCROBBLE_INTERVAL = new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 5,
    ); // 5 days
    const activeUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        lastFmSessionKey: {
          not: null,
        },
        googleRefreshToken: {
          not: null,
        },
      },
      select: {
        id: true,
      },
    });

    const cronInterval = 60 * 5 * 1000; // in milliseconds
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
        },
      })),
    );

    await this.prisma.user.updateMany({
      data: {
        isActive: false,
      },
      where: {
        OR: [
          {
            googleRefreshToken: null,
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
