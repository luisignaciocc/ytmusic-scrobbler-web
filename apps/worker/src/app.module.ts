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
    }),
  ],
  controllers: [AppController],
  providers: [AppProducer, AppConsumer, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
