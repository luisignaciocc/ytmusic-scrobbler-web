import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

import getServerSession from "@/helpers/get-server-session";
import hashRequest from "@/helpers/hash-request";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
    return NextResponse.json(
      { error: "Env vars not set up correctly" },
      { status: 500 }
    );
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

    const user = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });

    if (!user || !user.lastFmSessionKey) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (
      !user.googleAccessToken ||
      !user.googleRefreshToken ||
      !user.googleTokenExpires
    ) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
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
          return NextResponse.json(
            { error: "Failed to fetch token" },
            { status: 500 }
          );
        }

        const data: {
          access_token: string;
          expires_in: number;
        } = await response.json();

        const expires_at = new Date().getTime() + data.expires_in * 1000;
        accessToken = data.access_token;

        await prisma.user.update({
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
          return NextResponse.json({ error: error.message }, { status: 500 });
        } else {
          return NextResponse.json(
            { error: "An unknown error occurred refreshing the user token" },
            { status: 500 }
          );
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
      prisma.song.deleteMany({
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
      return NextResponse.json({ error: "No results found" }, { status: 404 });
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
                ?.runs?.[0]?.navigationEndpoint?.watchEndpoint
          );

          const browseEndpointFlexColumnArtist = flexColumns.find(
            (flexColumn) =>
              flexColumn.musicResponsiveListItemFlexColumnRenderer?.text
                ?.runs?.[0]?.navigationEndpoint?.browseEndpoint
                ?.browseEndpointContextSupportedConfigs
                ?.browseEndpointContextMusicConfig?.pageType ===
              "MUSIC_PAGE_TYPE_ARTIST"
          );

          const browseEndpointFlexColumnAlbum = flexColumns.find(
            (flexColumn) =>
              flexColumn.musicResponsiveListItemFlexColumnRenderer?.text
                ?.runs?.[0]?.navigationEndpoint?.browseEndpoint
                ?.browseEndpointContextSupportedConfigs
                ?.browseEndpointContextMusicConfig?.pageType ===
              "MUSIC_PAGE_TYPE_ALBUM"
          );

          if (!watchEndpointFlexColumn || !browseEndpointFlexColumnArtist) {
            return;
          }

          const title =
            watchEndpointFlexColumn.musicResponsiveListItemFlexColumnRenderer
              ?.text?.runs?.[0]?.text;
          const artist =
            browseEndpointFlexColumnArtist
              .musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
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
        }
      );
    });

    songs
      .filter((song) => song.playedAt === "Today")
      .forEach(async (song) => {
        try {
          const savedSong = await prisma.song.findFirst({
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

            const result: LastFmScrobbleResponse = await parseStringPromise(
              text
            );

            const scrobbles = result.lfm.scrobbles?.[0].$;
            const accepted = scrobbles?.accepted;
            const ignored = scrobbles?.ignored;

            if (accepted === "0" && ignored === "0") {
              console.error("Error scrobbling song", result);
            } else if (accepted === "0") {
              console.error(
                "Song scrobble was ignored",
                result.lfm.scrobbles?.[0].scrobble[0].ignoredMessage
              );
            } else {
              await prisma.song.create({
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
          console.error("Error saving song", error);
        }
      });

    return NextResponse.json({ songs }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}

type YTAPIResponse = {
  musicShelfRenderer?: {
    title?: {
      runs?: [{ text?: "Today" | "Yesterday" | "This week" | string }];
    };
    contents?: {
      musicResponsiveListItemRenderer?: {
        flexColumns?: {
          musicResponsiveListItemFlexColumnRenderer?: {
            text?: {
              runs?: [
                {
                  text?: string;
                  navigationEndpoint?: {
                    watchEndpoint?: {
                      videoId?: string;
                      watchEndpointMusicSupportedConfigs?: {
                        watchEndpointMusicConfig?: {
                          musicVideoType?: "MUSIC_VIDEO_TYPE_ATV";
                        };
                      };
                    };
                    browseEndpoint?: {
                      browseEndpointContextSupportedConfigs?: {
                        browseEndpointContextMusicConfig?: {
                          pageType?:
                            | "MUSIC_PAGE_TYPE_ARTIST"
                            | "MUSIC_PAGE_TYPE_ALBUM";
                        };
                      };
                    };
                  };
                }
              ];
            };
          };
        }[];
      };
    }[];
  };
}[];

type LastFmScrobbleResponse = {
  lfm: {
    $: {
      status: "ok" | "failed";
    };
    scrobbles?: [
      {
        $: {
          ignored: "0" | "1";
          accepted: "1" | "0";
        };
        scrobble: [
          {
            track: [
              {
                _: string;
                $: {
                  corrected: "0";
                };
              }
            ];
            artist: [
              {
                _: string;
                $: {
                  corrected: "0";
                };
              }
            ];
            album: [
              {
                _: string;
                $: {
                  corrected: "0";
                };
              }
            ];
            albumArtist: [
              {
                $: {
                  corrected: "0";
                };
              }
            ];
            timestamp: [string];
            ignoredMessage: [
              {
                $: {
                  code: "0";
                };
              }
            ];
          }
        ];
      }
    ];
  };
};
