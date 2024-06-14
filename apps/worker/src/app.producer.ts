import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppProducer implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,

    @InjectQueue('scrobbler')
    private readonly queue: Queue,
  ) {}
  private readonly logger = new Logger(AppProducer.name);

  async onModuleInit() {
    await this.prisma.$connect();
  }

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'scrobble',
  })
  scrobble() {
    this.queue.add('scrobble', {
      userId: 'string',
    });
  }
}
