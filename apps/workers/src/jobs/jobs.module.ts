import { Module } from '@nestjs/common';
import { JobsProcessor } from './jobs.processor';

@Module({
  imports: [],
  providers: [JobsProcessor],
})
export class JobsModule {}
