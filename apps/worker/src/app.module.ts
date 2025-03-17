import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

import { AppConsumer } from "./app.consumer";
import { AppController } from "./app.controller";
import { AppProducer } from "./app.producer";
import { PrismaService } from "./prisma.service";

@Module({
  imports: [
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
        timeout: 15000,
        removeOnComplete: {
          age: 3 * 60 * 60, // 3 hours
        },
        removeOnFail: {
          age: 6 * 60 * 60, // 6 hours
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
