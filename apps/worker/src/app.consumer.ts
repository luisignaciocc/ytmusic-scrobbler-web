import { Processor, Process } from '@nestjs/bull';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from './prisma.service';

@Processor('scrobbler')
export class AppConsumer implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(AppConsumer.name);

  async onModuleInit() {
    this.logger.debug(`connecting to prisma...`);
    await this.prisma.$connect();
    this.logger.debug(`connected`);
  }

  @Process('scrobble')
  async scrobble(
    job: Job<{
      userId: 'string';
    }>,
  ) {
    const { userId } = job.data;
    this.logger.debug(`Scrobbling for user ${userId}`);
    const users = await this.prisma.user.findFirst();

    if (!users) {
      this.logger.error(`User not found: ${userId}`);
      return;
    } else {
      this.logger.debug(`User found: ${users.email}`);
    }
  }
}
