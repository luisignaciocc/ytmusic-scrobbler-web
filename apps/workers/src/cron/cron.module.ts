import { Module } from '@nestjs/common';
import { CronService } from './cron.service';

@Module({
  imports: [],
  providers: [CronService],
})
export class CronModule {}
