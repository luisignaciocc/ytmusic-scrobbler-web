import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('scrobbler')
export class JobsProcessor {
  constructor() {}
  private readonly logger = new Logger(JobsProcessor.name);

  @Process('scrobble')
  async scrobble(job: Job) {}
}
