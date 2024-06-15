import { Process, Processor } from "@nestjs/bull";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Job } from "bull";
import { parseStringPromise } from "xml2js";

import { PrismaService } from "./prisma.service";
import hashRequest from "./utils/functions";
import { LastFmScrobbleResponse, YTAPIResponse } from "./utils/types";
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
    this.logger.debug(`Scrobbling for user ${userId}`);
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (!user) {
      this.logger.error(`User ${userId} not found`);
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
      this.logger.error(`Missing environment variables`);
      return job.discard();
    }

    try {
      const res = await fetch("https://music.youtube.com", {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });
      const text = await res.text();
      const matches = text.match(/ytcfg\.set\s*\(\s*({.+?})\s*\)\s*;/);
      let visitorId = "";

      if (matches && matches.length > 0) {
        const ytcfg = JSON.parse(matches[1]);
        visitorId = ytcfg.VISITOR_DATA || "";
      }

      if (!user.lastFmSessionKey) {
        this.logger.error(`User ${userId} is not authenticated with Last.fm`);
        return job.discard();
      }

      if (
        !user.googleAccessToken ||
        !user.googleRefreshToken ||
        !user.googleTokenExpires
      ) {
        this.logger.error(`User ${userId} is not authenticated with Google`);
        return job.discard();
      }

      let accessToken = user.googleAccessToken;
      if (user.googleTokenExpires < new Date().getTime()) {
        try {
          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              client_id: GOOGLE_CLIENT_ID,
              client_secret: GOOGLE_CLIENT_SECRET,
              refresh_token: user.googleRefreshToken,
              grant_type: "refresh_token",
            }),
          });

          if (!response.ok) {
            this.logger.error(`Error refreshing user token for ${userId}`);
            return job.discard();
          }

          const data: {
            access_token: string;
            expires_in: number;
          } = await response.json();

          const expires_at = new Date().getTime() + data.expires_in * 1000;
          accessToken = data.access_token;

          await this.prisma.user.update({
            where: {
              googleId: user.googleId,
            },
            data: {
              googleAccessToken: data.access_token,
              googleTokenExpires: expires_at,
            },
          });
        } catch (error) {
          if (error instanceof Error) {
            this.logger.error(`Error refreshing user token for ${userId}`);
            this.logger.error(error);
            return job.discard();
          } else {
            this.logger.error(`Error refreshing user token for ${userId}`);
            return job.discard();
          }
        }
      }

      const [musicResponse] = await Promise.all([
        fetch("https://music.youtube.com/youtubei/v1/browse", {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Visitor-Id": visitorId,
            Authorization: `Bearer ${accessToken}`,
            Cookie: "SOCS=CAI",
            Origin: "https://music.youtube.com",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Referer: "https://music.youtube.com/",
          },
          body: JSON.stringify({
            context: {
              client: {
                clientName: "WEB_REMIX",
                clientVersion: "0.1",
                hl: "en",
                gl: "US",
                experimentsToken: "",
                utcOffsetMinutes: 0,
              },
            },
            browseId: "FEmusic_history",
          }),
        }),
        // delete song older tah 24h
        this.prisma.song.deleteMany({
          where: {
            userId: user.id,
            addedAt: {
              lt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      const data = await musicResponse.json();

      const results: YTAPIResponse =
        data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
          ?.content?.sectionListRenderer?.contents;

      if (!results) {
        this.logger.error(`No results found for user ${userId}`);
        return job.discard();
      }

      const songs: {
        title: string;
        artist: string;
        album: string;
        playedAt?: string;
      }[] = [];
      results.forEach(({ musicShelfRenderer }) => {
        if (!musicShelfRenderer) {
          return;
        }
        const playedAt = musicShelfRenderer?.title?.runs?.[0]?.text;

        musicShelfRenderer?.contents?.forEach(
          ({ musicResponsiveListItemRenderer }) => {
            if (!musicResponsiveListItemRenderer) {
              return;
            }
            const flexColumns = musicResponsiveListItemRenderer?.flexColumns;

            if (!flexColumns) {
              return;
            }

            const watchEndpointFlexColumn = flexColumns.find(
              (flexColumn) =>
                flexColumn.musicResponsiveListItemFlexColumnRenderer?.text
                  ?.runs?.[0]?.navigationEndpoint?.watchEndpoint,
            );

            const browseEndpointFlexColumnArtist = flexColumns.find(
              (flexColumn) =>
                flexColumn.musicResponsiveListItemFlexColumnRenderer?.text
                  ?.runs?.[0]?.navigationEndpoint?.browseEndpoint
                  ?.browseEndpointContextSupportedConfigs
                  ?.browseEndpointContextMusicConfig?.pageType ===
                "MUSIC_PAGE_TYPE_ARTIST",
            );

            const browseEndpointFlexColumnAlbum = flexColumns.find(
              (flexColumn) =>
                flexColumn.musicResponsiveListItemFlexColumnRenderer?.text
                  ?.runs?.[0]?.navigationEndpoint?.browseEndpoint
                  ?.browseEndpointContextSupportedConfigs
                  ?.browseEndpointContextMusicConfig?.pageType ===
                "MUSIC_PAGE_TYPE_ALBUM",
            );

            if (!watchEndpointFlexColumn || !browseEndpointFlexColumnArtist) {
              return;
            }

            const title =
              watchEndpointFlexColumn.musicResponsiveListItemFlexColumnRenderer
                ?.text?.runs?.[0]?.text;
            const artist =
              browseEndpointFlexColumnArtist
                .musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]
                ?.text;
            const album =
              browseEndpointFlexColumnAlbum
                ?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]
                ?.text || title;

            if (title && artist) {
              songs.push({
                title,
                artist,
                album: album!,
                playedAt,
              });
            }
          },
        );
      });

      songs
        .filter((song) => song.playedAt === "Today")
        .forEach(async (song) => {
          try {
            const savedSong = await this.prisma.song.findFirst({
              where: {
                title: song.title,
                artist: song.artist,
                album: song.album,
                userId: user.id,
              },
            });
            if (!savedSong) {
              const url = new URL("http://ws.audioscrobbler.com/2.0/");

              const params = {
                album: song.album,
                api_key: LAST_FM_API_KEY,
                method: "track.scrobble",
                timestamp: (
                  Math.floor(new Date().getTime() / 1000) - 30
                ).toString(),
                track: song.title,
                artist: song.artist,
                sk: user.lastFmSessionKey!,
              };

              const requestHash = hashRequest(params, LAST_FM_API_SECRET);

              const urlParams = new URLSearchParams(params);
              urlParams.append("api_sig", requestHash);

              url.search = urlParams.toString();

              const res = await fetch(url, {
                method: "POST",
              });

              const text = await res.text();

              const result: LastFmScrobbleResponse =
                await parseStringPromise(text);

              const scrobbles = result.lfm.scrobbles?.[0].$;
              const accepted = scrobbles?.accepted;
              const ignored = scrobbles?.ignored;

              if (accepted === "0" && ignored === "0") {
                console.error("Error scrobbling song", result);
              } else if (accepted === "0") {
                console.error(
                  "Song scrobble was ignored",
                  result.lfm.scrobbles?.[0].scrobble[0].ignoredMessage,
                );
              } else {
                await this.prisma.song.create({
                  data: {
                    title: song.title,
                    artist: song.artist,
                    album: song.album,
                    addedAt: new Date(),
                    userId: user.id,
                  },
                });
              }
            }
          } catch (error) {
            this.logger.error(`Error scrobbling song for user ${userId}`);
            this.logger.error(error);
            return job.discard();
          }
        });
    } catch (error) {
      this.logger.error(`Error scrobbling for user ${userId}`);
      this.logger.error(error);
      return job.discard();
    }
  }
}
