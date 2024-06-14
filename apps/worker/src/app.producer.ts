import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';

@Injectable()
export class AppProducer {
  constructor(
    @InjectQueue('scrobbler')
    private readonly queue: Queue,
  ) {}
  private readonly logger = new Logger(AppProducer.name);

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'scrobble',
  })
  scrobble() {
    this.queue.add('scrobble', {
      userId: 'string',
    });
  }
}
