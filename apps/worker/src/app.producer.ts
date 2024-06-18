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
    const activeUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        lastFmSessionKey: {
          not: null,
        },
        googleAccessToken: {
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

    this.queue.addBulk(
      activeUsers.map((user) => ({
        name: "scrobble",
        data: {
          userId: user.id,
        },
      })),
    );
  }
}
