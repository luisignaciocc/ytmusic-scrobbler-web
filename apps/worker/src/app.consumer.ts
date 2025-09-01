import { Process, Processor } from "@nestjs/bull";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Job } from "bull";

import { PrismaService } from "./prisma.service";
import {
  detectDateValue,
  getUnknownDateValues,
  isTodaySong,
} from "./utils/date-detection";
import { getYTMusicHistoryFromPage, scrobbleSong } from "./utils/functions";
enum FailureType {
  AUTH = "AUTH",
  NETWORK = "NETWORK",
  LASTFM = "LASTFM",
  UNKNOWN = "UNKNOWN",
}

@Processor("scrobbler")
export class AppConsumer implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(AppConsumer.name);

  private getValidNotificationEmail(user: { notificationEmail: string | null; email: string }): string | null {
    // Priority 1: Use notificationEmail if it exists and is valid
    if (user.notificationEmail && this.isValidEmailAddress(user.notificationEmail)) {
      return user.notificationEmail;
    }

    // Priority 2: Use main email only if it's valid and not a Google Pages account
    if (this.isValidEmailAddress(user.email) && !this.isGooglePagesEmail(user.email)) {
      return user.email;
    }

    // No valid email found
    return null;
  }

  private isValidEmailAddress(email: string): boolean {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isGooglePagesEmail(email: string): boolean {
    // Check for Google Pages or other non-personal Google accounts
    const googlePagesPatterns = [
      /pages\.google\.com$/i,
      /googleusercontent\.com$/i,
      /noreply.*google/i,
      /donotreply.*google/i,
      // Add more patterns as needed based on what you observe
    ];

    return googlePagesPatterns.some(pattern => pattern.test(email));
  }

  private async handleUserFailure(
    userId: string,
    failureType: FailureType,
    errorMessage: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { consecutiveFailures: true, lastFailureType: true },
    });

    if (!user) return;

    const newFailureCount = user.consecutiveFailures + 1;
    const shouldDeactivate = this.shouldDeactivateUser(
      failureType,
      newFailureCount,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        consecutiveFailures: newFailureCount,
        lastFailureType: failureType,
        lastFailedAt: new Date(),
        ...(shouldDeactivate && { isActive: false }),
      },
    });

    this.logger.debug(
      `User ${userId} failure #${newFailureCount} (${failureType}): ${errorMessage}${
        shouldDeactivate ? " - USER DEACTIVATED" : ""
      }`,
    );

    return shouldDeactivate;
  }

  private shouldDeactivateUser(
    failureType: FailureType,
    consecutiveFailures: number,
  ): boolean {
    switch (failureType) {
      case FailureType.AUTH:
        return consecutiveFailures >= 3; // Auth issues are persistent
      case FailureType.NETWORK:
        return consecutiveFailures >= 5; // Network issues might be temporary
      case FailureType.LASTFM:
        return consecutiveFailures >= 5; // Last.fm issues might be temporary
      case FailureType.UNKNOWN:
        return consecutiveFailures >= 7; // Give more chances for unknown errors
      default:
        return false;
    }
  }

  private async handleUserSuccess(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        consecutiveFailures: 0,
        lastFailureType: null,
        lastFailedAt: null,
        lastSuccessfulScrobble: new Date(),
        // Reset auth notification counter and timestamp on successful scrobble
        authNotificationCount: 0,
        lastNotificationSent: null, // Reset only after proven successful scrobble
      },
    });
  }

  private categorizeEmailError(error: unknown): {
    type: "RATE_LIMIT" | "INVALID_EMAIL" | "API_KEY" | "NETWORK" | "UNKNOWN";
    shouldRetry: boolean;
    retryDelay?: number;
  } {
    // Handle Resend-specific error format
    if (typeof error === "object" && error !== null && "error" in error) {
      const resendError = error.error as {
        statusCode?: number;
        name?: string;
        message?: string;
      };

      // Rate limit errors (429 status or daily_quota_exceeded)
      if (
        resendError.statusCode === 429 ||
        resendError.name === "daily_quota_exceeded" ||
        resendError.message?.toLowerCase().includes("quota") ||
        resendError.message?.toLowerCase().includes("rate limit")
      ) {
        return {
          type: "RATE_LIMIT",
          shouldRetry: true,
          retryDelay: 24 * 60 * 60 * 1000, // 24 hours
        };
      }

      // Invalid email errors
      if (
        resendError.statusCode === 400 ||
        resendError.message?.toLowerCase().includes("invalid email") ||
        resendError.message?.toLowerCase().includes("malformed")
      ) {
        return {
          type: "INVALID_EMAIL",
          shouldRetry: false,
        };
      }

      // API key errors
      if (
        resendError.statusCode === 401 ||
        resendError.statusCode === 403 ||
        resendError.message?.toLowerCase().includes("unauthorized") ||
        resendError.message?.toLowerCase().includes("api key")
      ) {
        return {
          type: "API_KEY",
          shouldRetry: false,
        };
      }
    }

    // Handle standard Error objects
    const message = (error as Error).message?.toLowerCase() || "";

    // Network/connectivity errors
    if (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnreset") ||
      message.includes("enotfound")
    ) {
      return {
        type: "NETWORK",
        shouldRetry: true,
        retryDelay: 5 * 60 * 1000, // 5 minutes
      };
    }

    // Default to unknown error
    return {
      type: "UNKNOWN",
      shouldRetry: false,
    };
  }

  private categorizeError(error: Error): FailureType {
    const errorMessage = error?.message || String(error);

    // Authentication errors
    if (
      errorMessage.includes("401") ||
      errorMessage.includes("UNAUTHENTICATED") ||
      errorMessage.includes("authentication credential") ||
      errorMessage.includes("Headers.append") ||
      errorMessage.includes("invalid header value") ||
      errorMessage.includes("__Secure-3PAPISID")
    ) {
      return FailureType.AUTH;
    }

    // Network/YouTube Music errors
    if (
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("network") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("ECONNRESET") ||
      errorMessage.includes("ENOTFOUND")
    ) {
      return FailureType.NETWORK;
    }

    // Last.fm specific errors
    if (
      errorMessage.includes("audioscrobbler") ||
      errorMessage.includes("last.fm") ||
      errorMessage.includes("scrobble")
    ) {
      return FailureType.LASTFM;
    }

    return FailureType.UNKNOWN;
  }

  private async sendAuthFailureNotification(
    user: {
      id: string;
      name: string;
      email: string;
      notificationEmail: string | null;
      notificationsEnabled: boolean;
      lastNotificationSent: Date | null;
      authNotificationCount: number;
    },
    job: Job,
    notificationType: "expired" | "invalid" | "silent",
  ) {
    const currentDate = new Date();

    // Smart notification business logic:
    // - Maximum 3 notifications per auth failure issue
    // - Escalating intervals: 1st=immediate, 2nd=2 days, 3rd=5 days, then stop
    // - Respects user's notificationsEnabled setting
    // - Uses either notificationEmail or regular email as recipient

    // Check if we've hit the notification limit
    if (user.authNotificationCount >= 3) {
      job.log(
        `Email notification skipped: User ${user.id} has already received maximum 3 auth failure notifications`,
      );
      return;
    }

    // Check if notifications are disabled
    if (user.notificationsEnabled === false) {
      job.log(
        `Email notification skipped: User ${user.id} has disabled notifications`,
      );
      return;
    }

    // Calculate required interval based on notification count
    const getIntervalHours = (count: number): number => {
      switch (count) {
        case 0:
          return 0; // First notification: immediate
        case 1:
          return 48; // Second notification: 2 days
        case 2:
          return 120; // Third notification: 5 days
        default:
          return Infinity; // No more notifications
      }
    };

    const requiredIntervalMs =
      getIntervalHours(user.authNotificationCount) * 60 * 60 * 1000;
    const canSendNotification =
      !user.lastNotificationSent ||
      currentDate.getTime() - user.lastNotificationSent.getTime() >=
        requiredIntervalMs;

    if (!canSendNotification) {
      const nextIntervalHours = getIntervalHours(user.authNotificationCount);
      const hoursRemaining =
        nextIntervalHours -
        Math.floor(
          (currentDate.getTime() -
            (user.lastNotificationSent?.getTime() || 0)) /
            (60 * 60 * 1000),
        );
      job.log(
        `Email notification skipped: User ${user.id} needs to wait ${hoursRemaining} more hours before next notification (attempt ${user.authNotificationCount + 1}/3)`,
      );
      return;
    }

    const { RESEND_API_KEY } = process.env;
    const recipientEmail = this.getValidNotificationEmail(user);

    if (!RESEND_API_KEY || !recipientEmail) {
      if (!recipientEmail) {
        const isGooglePages = this.isGooglePagesEmail(user.email);
        if (isGooglePages) {
          job.log(`Skipping email notification: User has Google Pages/App account (${user.email}) and no valid notificationEmail set`);
        } else {
          job.log(`Cannot send email notification: No valid email address (checked notificationEmail: ${user.notificationEmail}, email: ${user.email})`);
        }
      }
      if (!RESEND_API_KEY) {
        job.log(`Cannot send email notification: Missing RESEND_API_KEY`);
      }
      return;
    }

    try {
      const { Resend } = await import("resend");
      const resend = new Resend(RESEND_API_KEY);

      const subjects = {
        expired: "Action Required: YouTube Music Credentials Expired",
        invalid: "Action Required: YouTube Music Headers Invalid",
        silent: "Action Required: YouTube Music Authentication Failed",
      };

      const descriptions = {
        expired:
          "We noticed that your YouTube Music credentials have expired, which means we can no longer access your listening history to scrobble tracks to Last.fm.",
        invalid:
          "We noticed that your YouTube Music headers are invalid or malformed, which means we can no longer access your listening history to scrobble tracks to Last.fm.",
        silent:
          "We detected that your YouTube Music authentication is failing silently (returning empty responses), which means we can no longer access your listening history to scrobble tracks to Last.fm.",
      };

      const getNextNotificationInfo = (count: number): string => {
        switch (count) {
          case 0:
            return "You will receive up to 2 more reminders if this issue continues: one in 2 days and a final one in 5 days.";
          case 1:
            return "You will receive 1 more reminder in 5 days if this issue isn't resolved.";
          case 2:
            return "This is your final reminder about this authentication issue.";
          default:
            return "";
        }
      };

      await resend.emails.send({
        from: "YTMusic Scrobbler <noreply@bocono-labs.com>",
        to: recipientEmail,
        subject: subjects[notificationType],
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${subjects[notificationType].replace("Action Required: ", "")}</h2>
            <p>Hello ${user.name},</p>
            <p>${descriptions[notificationType]}</p>
            <p><strong>⚠️ Your account has been automatically paused</strong> to prevent repeated failures. Scrobbling will resume once you update your credentials.</p>
            <p><strong>Reminder ${user.authNotificationCount + 1} of 3:</strong> ${getNextNotificationInfo(user.authNotificationCount)}</p>
            <p>To resolve this issue and reactivate your account, you can:</p>
            <ul>
              <li><strong>Update your authentication headers by visiting our website</strong> - this will automatically reactivate your account</li>
              <li>Disable notifications from your account settings if you no longer want to use the service</li>
              <li>Contact support if you need help</li>
            </ul>
            <p>If you want to continue using the YTMusic Scrobbler service, please visit our website and update your authentication headers:</p>
            <p style="text-align: center;">
              <a href="https://scrobbler.bocono-labs.com" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Update My Credentials</a>
            </p>
            <p>If you need help, please contact our support team at <a href="mailto:me@luisignacio.cc">me@luisignacio.cc</a>.</p>
            <p>Thank you for using YTMusic Scrobbler!</p>
            <p>- The Bocono Labs Team</p>
          </div>
        `,
      });

      // Update notification tracking fields and deactivate user
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastNotificationSent: currentDate,
          authNotificationCount: user.authNotificationCount + 1,
          isActive: false, // Deactivate user when notification email is sent (may already be false from handleUserFailure)
        },
      });

      this.logger.debug(
        `${notificationType} auth failure notification (${user.authNotificationCount + 1}/3) sent to ${recipientEmail} for user ${user.id} - USER DEACTIVATED`,
      );
      job.log(
        `Notification email sent to user ${recipientEmail} (reminder ${user.authNotificationCount + 1} of 3) - User deactivated until credentials are updated`,
      );
    } catch (emailError) {
      // Categorize the email error to handle different types appropriately
      const errorInfo = this.categorizeEmailError(emailError);

      this.logger.debug(
        `Email error for user ${user.id}: ${errorInfo.type} - ${emailError.message || "Unknown error"}`,
      );

      switch (errorInfo.type) {
        case "RATE_LIMIT":
          // Rate limit reached - skip email notification for now
          // It will be attempted again on the next authentication failure
          job.log(
            `Email notification skipped due to daily rate limit reached. Will retry on next auth failure for user ${recipientEmail}`,
          );

          this.logger.debug(
            `Email notification skipped for user ${user.id} due to rate limit - will retry on next failure`,
          );

          // DO NOT update lastNotificationSent or authNotificationCount
          // This ensures the notification will be attempted again on the next auth failure
          return; // Exit early without updating database
          break;

        case "INVALID_EMAIL":
          job.log(
            `Email notification failed - invalid email address: ${recipientEmail}`,
          );
          // Continue with normal flow - update counters since this is a permanent error
          break;

        case "API_KEY":
          job.log(
            `Email notification failed - Resend API key issue. Contact administrator.`,
          );
          // Continue with normal flow - this is a system configuration issue
          break;

        case "NETWORK":
          job.log(
            `Email notification failed due to network issue: ${emailError.message}. Will retry later.`,
          );
          // Don't update counters for network errors - they might be temporary
          return; // Exit early without updating database

        default:
          job.log(
            `Email notification failed with unknown error: ${emailError.message}`,
          );
          // Continue with normal flow for unknown errors
          break;
      }

      // For rate limit and network errors, we already returned early above
      // No need to check again here since those cases are handled in the switch
    }
  }


  async onModuleInit() {
    this.logger.debug(`connecting to prisma...`);
    await this.prisma.$connect();
    this.logger.debug(`connected`);
  }


  @Process({ name: "scrobble", concurrency: 2 })
  async scrobble(
    job: Job<{
      userId: string;
    }>,
  ) {
    const { userId } = job.data;
    this.logger.debug(
      `Starting scrobble job for user ${userId} at ${new Date()}`,
    );
    job.log(`Starting scrobble process for user ${userId}`);

    this.logger.debug(`Fetching user data for ${userId}`);
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        notificationEmail: true,
        notificationsEnabled: true,
        lastNotificationSent: true,
        authNotificationCount: true,
        lastFmSessionKey: true,
        lastFmUsername: true,
        ytmusicCookie: true,
      },
    });
    if (!user) {
      this.logger.debug(`User ${userId} not found in database`);
      job.log(`User ${userId} not found`);
      return job.moveToFailed({
        message: `User ${userId} not found`,
      });
    }

    this.logger.debug(`User found: ${user.name} (${user.lastFmUsername})`);
    job.log(`Processing user: ${user.name} (Last.fm: ${user.lastFmUsername})`);

    this.logger.debug(`Checking environment variables`);
    const { LAST_FM_API_KEY, LAST_FM_API_SECRET } = process.env;

    if (!LAST_FM_API_KEY || !LAST_FM_API_SECRET) {
      this.logger.debug(`Missing Last.fm API credentials in environment`);
      job.log(`Missing environment variables`);
      return job.moveToFailed({
        message: `Missing environment variables`,
      });
    }

    this.logger.debug(`Environment variables validated successfully`);

    try {
      if (!user.lastFmSessionKey) {
        this.logger.debug(`User ${userId} missing Last.fm session key`);
        job.log(`User ${userId} has no Last.fm session key`);
        return job.moveToFailed({
          message: `User ${userId} has no Last.fm session key`,
        });
      }

      this.logger.debug(`Last.fm session key validated for user ${userId}`);

      if (!user.ytmusicCookie) {
        this.logger.debug(`User ${userId} missing YouTube Music cookie`);
        job.log(`User ${userId} has no YouTube Music headers`);
        return job.moveToFailed({
          message: `User ${userId} has no YouTube Music headers`,
        });
      }

      this.logger.debug(
        `YouTube Music cookie validated for user ${userId} (length: ${user.ytmusicCookie.length} chars)`,
      );
      job.log(`Credentials validated - fetching music history`);

      let songs: {
        title: string;
        artist: string;
        album: string;
        playedAt?: string;
      }[] = [];
      let songsOnDB: {
        id: string;
        title: string;
        artist: string;
        album: string;
        arrayPosition: number;
        addedAt: Date;
        userId: string;
      }[] = [];

      try {
        this.logger.debug(
          `Fetching YouTube Music history and database songs for user ${userId}`,
        );
        job.log(`Fetching music history from YouTube Music and database`);

        [songs, songsOnDB] = await Promise.all([
          getYTMusicHistoryFromPage({
            cookie: user.ytmusicCookie,
          }),
          this.prisma.song.findMany({
            where: {
              userId: user.id,
            },
          }),
        ]);

        this.logger.debug(
          `Fetched ${songs.length} songs from YT Music, ${songsOnDB.length} songs from database for user ${userId}`,
        );
        job.log(
          `Retrieved ${songs.length} songs from YouTube Music, ${songsOnDB.length} existing songs from database`,
        );

        // Check for silent authentication failure (empty response)
        if (songs.length === 0) {
          this.logger.debug(
            `Silent auth failure detected for user ${userId}: Empty song response despite successful HTTP request`,
          );

          const failureType = FailureType.AUTH;
          const wasDeactivated = await this.handleUserFailure(
            userId,
            failureType,
            "Silent authentication failure: YouTube Music returned empty response",
          );

          // Send notification for silent auth failure
          await this.sendAuthFailureNotification(user, job, "silent");

          job.log(
            `Silent authentication failure detected for user ${userId}: Empty response${wasDeactivated ? " (user deactivated)" : ""}`,
          );

          await job.progress(100);
          return {
            status: "success",
            authError: true,
            message:
              "YouTube Music authentication failed silently (empty response)",
          };
        }
      } catch (error) {
        const failureType = this.categorizeError(error);
        const wasDeactivated = await this.handleUserFailure(
          userId,
          failureType,
          error.message,
        );

        // Check if this is the specific 401 error we want to handle differently
        if (
          error.message?.includes("401") &&
          error.message?.includes("UNAUTHENTICATED") &&
          error.message?.includes(
            "Request is missing required authentication credential",
          )
        ) {
          this.logger.debug(
            `Authentication error (401 UNAUTHENTICATED) for user ${userId}${wasDeactivated ? " - USER DEACTIVATED" : ""}`,
          );
          job.log(
            `Authentication error detected for user ${userId}: YouTube Music credentials expired${wasDeactivated ? " (user deactivated)" : ""}`,
          );

          // Send an email notification to the user about expired credentials
          await this.sendAuthFailureNotification(user, job, "expired");

          // Mark the job as successful but with special status
          await job.progress(100);
          return {
            status: "success",
            authError: true,
            message: "YouTube Music authentication credentials expired",
          };
        }

        // Check for invalid header value error
        if (
          error.message?.includes("Headers.append") &&
          error.message?.includes("is an invalid header value")
        ) {
          this.logger.debug(
            `Invalid header value error for user ${userId}: malformed YouTube Music headers${wasDeactivated ? " - USER DEACTIVATED" : ""}`,
          );
          job.log(
            `Invalid header value error detected for user ${userId}: YouTube Music headers are malformed${wasDeactivated ? " (user deactivated)" : ""}`,
          );

          // Send an email notification to the user about invalid headers
          await this.sendAuthFailureNotification(user, job, "invalid");

          // Mark the job as successful but with special status
          await job.progress(100);
          return {
            status: "success",
            authError: true,
            message: "YouTube Music headers are invalid",
          };
        }

        // Re-throw other errors to be caught by the outer try-catch - they will be handled by the outer catch
        throw error;
      }

      // Filter songs played today using comprehensive multilingual detection
      const todaySongs = songs.filter((song) => isTodaySong(song.playedAt));

      // Log unknown playedAt values for future expansion
      const unknownValues = getUnknownDateValues(songs);
      if (unknownValues.length > 0) {
        this.logger.debug(
          `Unknown playedAt values found for user ${userId}: ${unknownValues.join(", ")}`,
        );
        job.log(
          `Unknown date formats detected: ${unknownValues.join(", ")} - please report to admin`,
        );
      }

      // Log detected languages for monitoring
      const detectedLanguages = new Set<string>();
      songs.forEach((song) => {
        const detection = detectDateValue(song.playedAt);
        if (detection.detectedLanguage && detection.isToday) {
          detectedLanguages.add(detection.detectedLanguage);
        }
      });

      if (detectedLanguages.size > 0) {
        this.logger.debug(
          `Today's songs detected in languages: ${Array.from(detectedLanguages).join(", ")} for user ${userId}`,
        );
      }

      this.logger.debug(
        `Filtered ${todaySongs.length} songs played today for user ${userId}`,
      );
      job.log(`Found ${todaySongs.length} songs played today`);

      if (songsOnDB.length > 0) {
        const songsToDelete = songsOnDB.filter(
          (song) =>
            !todaySongs.some(
              (todaySong) =>
                todaySong.title === song.title &&
                todaySong.artist === song.artist &&
                todaySong.album === song.album,
            ),
        );

        if (songsToDelete.length > 0) {
          this.logger.debug(
            `Deleting ${songsToDelete.length} old songs from database for user ${userId}`,
          );
          job.log(
            `Removing ${songsToDelete.length} songs no longer in today's history`,
          );

          await this.prisma.song.deleteMany({
            where: {
              id: {
                in: songsToDelete.map((song) => song.id),
              },
            },
          });
        }
      }

      let songsReproducedToday = 0;
      let songsScrobbled = 0;

      this.logger.debug(
        `Starting to process ${todaySongs.length} songs for user ${userId}`,
      );
      job.log(`Processing ${todaySongs.length} songs for scrobbling`);

      for (const song of todaySongs) {
        songsReproducedToday++;
        try {
          if (songsOnDB.length === 0) {
            // First time scrobbling, don't send all the previous songs to Last.fm
            this.logger.debug(
              `First-time user ${userId}: Adding song "${song.title}" to database without scrobbling`,
            );

            await this.prisma.song.create({
              data: {
                title: song.title,
                artist: song.artist,
                album: song.album,
                addedAt: new Date(),
                userId: user.id,
                arrayPosition: songsReproducedToday,
              },
            });
            continue;
          }
          const savedSong = await this.prisma.song.findFirst({
            where: {
              title: song.title,
              artist: song.artist,
              album: song.album,
              userId: user.id,
            },
          });
          if (!savedSong) {
            this.logger.debug(
              `New song detected for user ${userId}: "${song.title}" by ${song.artist}`,
            );

            await Promise.all([
              scrobbleSong({
                song,
                lastFmApiKey: LAST_FM_API_KEY,
                lastFmApiSecret: LAST_FM_API_SECRET,
                lastFmSessionKey: user.lastFmSessionKey!,
                timestamp: (
                  Math.floor(new Date().getTime() / 1000) -
                  30 * (songsScrobbled + 1)
                ).toString(),
              }),
              this.prisma.song.create({
                data: {
                  title: song.title,
                  artist: song.artist,
                  album: song.album,
                  addedAt: new Date(),
                  userId: user.id,
                  arrayPosition: songsReproducedToday,
                },
              }),
            ]);

            songsScrobbled++;
            this.logger.debug(
              `Successfully scrobbled new song for user ${userId}: "${song.title}" by ${song.artist}`,
            );
            job.log(
              `Scrobbled song ${song.title} by ${song.artist} - user ${userId}`,
            );
          } else if (savedSong.arrayPosition > songsReproducedToday) {
            this.logger.debug(
              `Repositioned song for user ${userId}: "${song.title}" moved from position ${savedSong.arrayPosition} to ${songsReproducedToday}`,
            );

            await Promise.all([
              scrobbleSong({
                song,
                lastFmApiKey: LAST_FM_API_KEY,
                lastFmApiSecret: LAST_FM_API_SECRET,
                lastFmSessionKey: user.lastFmSessionKey!,
                timestamp: (
                  Math.floor(new Date().getTime() / 1000) -
                  30 * (songsScrobbled + 1)
                ).toString(),
              }),
              this.prisma.song.update({
                where: {
                  id: savedSong.id,
                },
                data: {
                  arrayPosition: songsReproducedToday,
                },
              }),
            ]);

            songsScrobbled++;
            this.logger.debug(
              `Successfully scrobbled repositioned song for user ${userId}: "${song.title}" by ${song.artist}`,
            );
            job.log(
              `Scrobbled repositioned song: ${song.title} by ${song.artist}`,
            );
          }
        } catch (error) {
          this.logger.debug(
            `Error processing song "${song.title}" for user ${userId}: ${error.message}`,
          );

          const failureType = this.categorizeError(error);
          const wasDeactivated = await this.handleUserFailure(
            userId,
            failureType,
            error.message,
          );

          job.log(
            `Error scrobbling song for user ${userId}${wasDeactivated ? " (user deactivated)" : ""}`,
          );
          job.log(error);
          return job.moveToFailed(error);
        }
      }

      this.logger.debug(
        `Scrobbling completed for user ${userId}: ${songsScrobbled} songs scrobbled out of ${songsReproducedToday} songs played today`,
      );
      job.log(
        `Scrobbling completed: ${songsScrobbled} songs scrobbled out of ${songsReproducedToday} total`,
      );

      await Promise.all([
        job.progress(100),
        this.handleUserSuccess(userId), // Reset failure counter and update last successful scrobble
      ]);

      this.logger.debug(
        `Database updated with successful scrobble data for user ${userId}`,
      );

      return {
        songsReproducedToday,
        songsScrobbled,
      };
    } catch (error) {
      this.logger.debug(
        `Critical error in scrobble process for user ${userId}: ${error.message}`,
      );

      const failureType = this.categorizeError(error);
      const wasDeactivated = await this.handleUserFailure(
        userId,
        failureType,
        error.message,
      );

      job.log(
        `Error scrobbling for user ${userId} (${user.lastFmUsername})${wasDeactivated ? " (user deactivated)" : ""}`,
      );
      job.log(error);
      return job.moveToFailed(error);
    }
  }
}
