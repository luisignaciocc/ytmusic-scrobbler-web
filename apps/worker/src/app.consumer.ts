import { Process, Processor } from "@nestjs/bull";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Job } from "bull";

import { PrismaService } from "./prisma.service";
import {
  getGoogleVisitorId,
  getNewGoogleToken,
  getYTMusicHistory,
  scrobbleSong,
} from "./utils/functions";
@Processor("scrobbler")
export class AppConsumer implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(AppConsumer.name);

  async onModuleInit() {
    this.logger.debug(`connecting to prisma...`);
    await this.prisma.$connect();
    this.logger.debug(`connected`);
  }

  @Process("scrobble")
  async scrobble(
    job: Job<{
      userId: "string";
    }>,
  ) {
    const { userId } = job.data;
    this.logger.debug(`Scrobbling for user ${userId} at ${new Date()}`);
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (!user) {
      job.log(`User ${userId} not found`);
      return job.discard();
    }

    const {
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      LAST_FM_API_KEY,
      LAST_FM_API_SECRET,
    } = process.env;

    if (
      !GOOGLE_CLIENT_ID ||
      !GOOGLE_CLIENT_SECRET ||
      !LAST_FM_API_KEY ||
      !LAST_FM_API_SECRET
    ) {
      job.log(`Missing environment variables`);
      return job.discard();
    }

    try {
      const visitorId = await getGoogleVisitorId();

      if (!user.lastFmSessionKey) {
        job.log(`User ${userId} is not authenticated with Last.fm`);
        return job.discard();
      }

      if (!user.googleRefreshToken) {
        job.log(`User ${userId} is not authenticated with Google`);
        return job.discard();
      }

      let accessToken = user.googleAccessToken;
      if (
        !user.googleTokenExpires ||
        user.googleTokenExpires < new Date().getTime()
      ) {
        try {
          const { accessToken: newAccessToken, expiresAt } =
            await getNewGoogleToken({
              clientId: GOOGLE_CLIENT_ID,
              clientSecret: GOOGLE_CLIENT_SECRET,
              refreshToken: user.googleRefreshToken,
            });

          await this.prisma.user.update({
            where: {
              googleId: user.googleId,
            },
            data: {
              googleAccessToken: newAccessToken,
              googleTokenExpires: expiresAt,
            },
          });
          accessToken = newAccessToken;
        } catch (error) {
          if (error instanceof Error) {
            job.log(`Error refreshing user token for ${userId}`);
            job.log(error.message);
            return job.discard();
          } else {
            job.log(`Error refreshing user token for ${userId}`);
            return job.discard();
          }
        }
      }

      const [songs, songsOnDB] = await Promise.all([
        getYTMusicHistory({
          visitorId,
          accessToken,
        }),
        this.prisma.song.findMany({
          where: {
            userId: user.id,
          },
        }),
      ]);

      const todaySongs = songs.filter((song) => song.playedAt === "Today");

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
      for (const song of todaySongs) {
        songsReproducedToday++;
        try {
          if (songsOnDB.length === 0) {
            // First time scrobbling, don't send all the previous songs to Last.fm
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
            job.log(
              `Scrobbled song ${song.title} by ${song.artist} - user ${userId}`,
            );
          } else if (savedSong.arrayPosition > songsReproducedToday) {
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
          }
        } catch (error) {
          job.log(`Error scrobbling song for user ${userId}`);
          job.log(error);
          return job.discard();
        }
      }

      this.logger.debug(`Scrobbling for user ${userId} done at ${new Date()}`);
      await Promise.all([
        job.progress(100),
        this.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            lastSuccessfulScrobble: new Date(),
          },
        }),
      ]);

      return {
        songsReproducedToday,
        songsScrobbled,
      };
    } catch (error) {
      job.log(`Error scrobbling for user ${userId}`);
      job.log(error);
      return job.discard();
    }
  }
}
