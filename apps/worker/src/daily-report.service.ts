import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import * as Sentry from "@sentry/nestjs";

import { REPORT_TIME_ZONE, sendDailyReport } from "./daily-report";
import { PrismaService } from "./prisma.service";

@Injectable()
export class DailyReportService {
  private readonly logger = new Logger(DailyReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron("0 8 * * *", { name: "dailyReport", timeZone: REPORT_TIME_ZONE })
  async send() {
    if (!process.env.REPORT_EMAIL) return; // not configured
    try {
      const subject = await sendDailyReport(this.prisma);
      this.logger.log(`Daily report sent: ${subject}`);
    } catch (error) {
      this.logger.error(`Daily report failed: ${error.message}`);
      Sentry.captureException(error);
    }
  }
}
