import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { SentryModule } from "@sentry/nestjs/setup";

import { AppConsumer } from "./app.consumer";
import { AppController } from "./app.controller";
import { AppProducer } from "./app.producer";
import { PrismaService } from "./prisma.service";

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: "localhost",
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: "scrobbler",
      defaultJobOptions: {
        timeout: 30000, // Increased from 15s to 30s for YT Music fetch + scrobble
        attempts: 1, // Keep at 1 since we handle failures with deactivation logic
        priority: 0, // Default priority - will be overridden by individual jobs
        removeOnComplete: {
          count: 50, // Keep last 50 completed jobs
          age: 3 * 60 * 60, // 3 hours
        },
        removeOnFail: {
          count: 100, // Keep more failed jobs for debugging
          age: 12 * 60 * 60, // 12 hours - longer retention for failed jobs
        },
        backoff: {
          type: "exponential",
          delay: 2000, // Not used since attempts = 1, but good fallback
        },
      },
    }),
    BullBoardModule.forRoot({
      route: "/dashboard",
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: "scrobbler",
      adapter: BullAdapter,
    }),
  ],
  controllers: [AppController],
  providers: [AppProducer, AppConsumer, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
