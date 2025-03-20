import { Process, Processor } from "@nestjs/bull";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Job } from "bull";

import { PrismaService } from "./prisma.service";
import { getYTMusicHistory, scrobbleSong } from "./utils/functions";
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
      userId: string;
    }>,
  ) {
    const { userId } = job.data;
    this.logger.debug(`Scrobbling for user ${userId} at ${new Date()}`);
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      job.log(`User ${userId} not found`);
      return job.discard();
    }

    const { LAST_FM_API_KEY, LAST_FM_API_SECRET } = process.env;

    if (!LAST_FM_API_KEY || !LAST_FM_API_SECRET) {
      job.log(`Missing environment variables`);
      return job.discard();
    }

    try {
      if (!user.lastFmSessionKey) {
        job.log(`User ${userId} has no Last.fm session key`);
        return job.discard();
      }

      if (!user.ytmusicCookie || !user.ytmusicAuthUser) {
        job.log(`User ${userId} has no YouTube Music headers`);
        return job.discard();
      }

      const [songs, songsOnDB] = await Promise.all([
        getYTMusicHistory({
          cookie: user.ytmusicCookie,
          authUser: user.ytmusicAuthUser,
          origin: user.ytmusicOrigin || undefined,
          visitorData: user.ytmusicVisitorData,
          authorization: user.ytmusicAuthorization,
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
      await job.discard();
      return job.moveToFailed(error);
    }
  }
}
