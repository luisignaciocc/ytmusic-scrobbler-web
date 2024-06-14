import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';

@Injectable()
export class CronService {
  constructor(
    @InjectQueue('scrobbler')
    private readonly scrobblerQueue: Queue,
  ) {}
  private readonly logger = new Logger(CronService.name);

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'scrobble',
  })
  scrobble() {
    this.scrobblerQueue.addBulk([]);
  }
}
