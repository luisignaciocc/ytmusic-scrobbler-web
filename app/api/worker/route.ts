import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { log } from "console";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Not user id provided" },
      { status: 400 }
    );
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
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
        id: id,
      },
    });

    if (!user) {
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

    const res2 = await fetch("https://music.youtube.com/youtubei/v1/browse", {
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
    });

    const data = await res2.json();

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
            console.log("No flexColumn");
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
            console.log("No watch or browse endpoint");
            console.log(JSON.stringify(flexColumns, null, 2));
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
          } else {
            console.log("No title or artist");
          }
        }
      );
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
