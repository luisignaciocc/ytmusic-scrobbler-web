import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
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
          age: 12 * 60 * 60,
        },
        removeOnFail: {
          age: 3 * 24 * 60 * 60,
        },
      },
    }),
    BullBoardModule.forRoot({
      route: "/dashboard",
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: "scrobbler",
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [AppController],
  providers: [AppProducer, AppConsumer, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
