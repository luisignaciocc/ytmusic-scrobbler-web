import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AppProducer } from "./app.producer";
import { AppConsumer } from "./app.consumer";
import { PrismaService } from "./prisma.service";

import { AppController } from "./app.controller";
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
