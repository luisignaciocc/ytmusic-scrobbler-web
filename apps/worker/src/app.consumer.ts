import { Process, Processor } from "@nestjs/bull";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Job } from "bull";

import { PrismaService } from "./prisma.service";
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
      },
    });
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
      } catch (error) {
        // Only send if:
        // 1. User is pro (paused)
        // 2. Notifications are enabled
        // 3. Has not received a notification in the last 5 days
        // 4. Either has a notification email or regular email
        const currentDate = new Date();
        const canSendNotification =
          // user.subscriptionPlan === "pro" &&
          user.notificationsEnabled !== false &&
          (!user.lastNotificationSent ||
            currentDate.getTime() - user.lastNotificationSent.getTime() >
              2 * 24 * 60 * 60 * 1000);
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
          try {
            const { RESEND_API_KEY } = process.env;

            const recipientEmail = user.notificationEmail || user.email;

            if (RESEND_API_KEY && recipientEmail && canSendNotification) {
              // Import Resend only when needed to avoid unnecessary imports
              const { Resend } = await import("resend");
              const resend = new Resend(RESEND_API_KEY);

              await resend.emails.send({
                from: "YTMusic Scrobbler <noreply@bocono-labs.com>",
                to: recipientEmail,
                subject: "Action Required: YouTube Music Credentials Expired",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>YouTube Music Credentials Expired</h2>
                    <p>Hello ${user.name},</p>
                    <p>We noticed that your YouTube Music credentials have expired, which means we can no longer access your listening history to scrobble tracks to Last.fm.</p>
                    <p>You will receive this notification every 2 days until you either:</p>
                    <ul>
                      <li>Update your authentication headers by visiting our website</li>
                      <li>Pause your scrobbling from your account settings</li>
                      <li>Reply to this email to stop receiving notifications</li>
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

              // Update the lastNotificationSent timestamp
              await this.prisma.user.update({
                where: { id: user.id },
                data: { lastNotificationSent: currentDate },
              });

              this.logger.debug(
                `Notification email sent successfully to ${recipientEmail} for user ${userId}`,
              );
              job.log(`Notification email sent to user ${recipientEmail}`);
            } else if (!recipientEmail) {
              job.log(`Cannot send email notification: No valid email address`);
            } else if (!RESEND_API_KEY) {
              job.log(`Cannot send email notification: Missing RESEND_API_KEY`);
            } else if (user.notificationsEnabled === false) {
              job.log(
                `Email notification skipped: User ${userId} has disabled notifications`,
              );
            } else if (
              user.lastNotificationSent &&
              currentDate.getTime() - user.lastNotificationSent.getTime() <=
                24 * 60 * 60 * 1000
            ) {
              job.log(
                `Email notification skipped: Already sent notification to ${userId} within the last 5 days`,
              );
            }
          } catch (emailError) {
            job.log(`Failed to send email notification: ${emailError.message}`);
            // Don't throw the error, just log it
          }

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
          try {
            const { RESEND_API_KEY } = process.env;

            const recipientEmail = user.notificationEmail || user.email;

            if (RESEND_API_KEY && recipientEmail && canSendNotification) {
              const { Resend } = await import("resend");
              const resend = new Resend(RESEND_API_KEY);

              await resend.emails.send({
                from: "YTMusic Scrobbler <noreply@bocono-labs.com>",
                to: recipientEmail,
                subject: "Action Required: YouTube Music Headers Invalid",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>YouTube Music Headers Invalid</h2>
                    <p>Hello ${user.name},</p>
                    <p>We noticed that your YouTube Music headers are invalid or malformed, which means we can no longer access your listening history to scrobble tracks to Last.fm.</p>
                    <p>You will receive this notification every 2 days until you either:</p>
                    <ul>
                      <li>Update your authentication headers by visiting our website</li>
                      <li>Pause your scrobbling from your account settings</li>
                      <li>Reply to this email to stop receiving notifications</li>
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

              // Update the lastNotificationSent timestamp
              await this.prisma.user.update({
                where: { id: user.id },
                data: { lastNotificationSent: currentDate },
              });

              this.logger.debug(
                `Invalid headers notification email sent to ${recipientEmail} for user ${userId}`,
              );
              job.log(
                `Notification email sent to user ${recipientEmail} about invalid headers`,
              );
            }
          } catch (emailError) {
            job.log(`Failed to send email notification: ${emailError.message}`);
          }

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

      // Support multiple languages for "Today"
      const todayVariants = ["Today", "Hoy", "Aujourd'hui", "Heute", "Oggi", "Hoje"];
      const todaySongs = songs.filter((song) => 
        song.playedAt && todayVariants.includes(song.playedAt)
      );

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
