import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('scrobbler')
export class AppConsumer {
  constructor() {}
  private readonly logger = new Logger(AppConsumer.name);

  @Process('scrobble')
  async scrobble(
    job: Job<{
      userId: 'string';
    }>,
  ) {
    const { userId } = job.data;
    this.logger.debug(`Scrobbling for user ${userId}`);
  }
}
