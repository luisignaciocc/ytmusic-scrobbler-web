import * as crypto from "crypto";
import { parseStringPromise } from "xml2js";

import { LastFmScrobbleResponse, YTAPIResponse } from "./types";

export function hashRequest(params: Record<string, string>, secretKey: string) {
  let string = "";
  const keys = Object.keys(params).sort();
  keys.forEach((key) => {
    string += key;
    string += params[key];
  });
  string += secretKey;
  return crypto.createHash("md5").update(string, "utf8").digest("hex");
}

export async function getNewGoogleToken({
  clientId,
  clientSecret,
  refreshToken,
}: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(error);
    throw new Error(error);
  }

  const data:
    | {
        access_token: string;
        expires_in: number;
      }
    | {
        error: string;
        error_description: string;
      } = await response.json();

  if ("error" in data) {
    throw new Error(data.error_description);
  }

  const expiresAt = new Date().getTime() + data.expires_in * 1000;
  const accessToken = data.access_token;

  return { accessToken, expiresAt };
}

export async function getGoogleVisitorId() {
  const res = await fetch("https://music.youtube.com", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch visitor id");
  }

  const text = await res.text();
  const matches = text.match(/ytcfg\.set\s*\(\s*({.+?})\s*\)\s*;/);

  if (matches && matches.length > 0) {
    const ytcfg = JSON.parse(matches[1]);
    return ytcfg.VISITOR_DATA || "";
  }
}

function sanitizeString(str: string): string {
  return str
    .replace(/[\u2026]/g, "...") // Replace ellipsis
    .replace(/[\u2013\u2014]/g, "-") // Replace en/em dashes
    .replace(/[\u2018\u2019]/g, "'") // Replace smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // Replace smart double quotes
    .replace(/[^\x00-\x7F]/g, ""); // Remove any other non-ASCII characters
}

export async function getYTMusicHistory({
  cookie,
  authUser,
  origin = "https://music.youtube.com",
  visitorData,
  authorization,
}: {
  cookie: string;
  authUser: string;
  origin?: string;
  visitorData: string;
  authorization: string;
}) {
  const musicResponse = await fetch(
    "https://music.youtube.com/youtubei/v1/browse",
    {
      method: "POST",
      cache: "no-store",
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        authorization: sanitizeString(authorization),
        "content-type": "application/json",
        Cookie: sanitizeString(cookie),
        origin: sanitizeString(origin),
        referer: "https://music.youtube.com/library",
        "sec-ch-ua":
          '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "macOS",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "same-origin",
        "sec-fetch-site": "same-origin",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        "x-goog-authuser": sanitizeString(authUser),
        "x-goog-visitor-id": sanitizeString(visitorData),
        "x-origin": sanitizeString(origin),
        "x-youtube-bootstrap-logged-in": "true",
        "x-youtube-client-name": "67",
        "x-youtube-client-version": "1.20250310.01.00",
      },
      body: JSON.stringify({
        context: {
          client: {
            hl: "en",
            gl: "CL",
            clientName: "WEB_REMIX",
            clientVersion: "1.20250310.01.00",
            userAgent:
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36,gzip(gfe)",
            clientFormFactor: "UNKNOWN_FORM_FACTOR",
            userInterfaceTheme: "USER_INTERFACE_THEME_DARK",
            timeZone: "America/Santiago",
            browserName: "Chrome",
            browserVersion: "133.0.0.0",
            osName: "Macintosh",
            osVersion: "10_15_7",
            platform: "DESKTOP",
            utcOffsetMinutes: -180,
            visitorData: visitorData,
          },
          user: {
            lockedSafetyMode: false,
          },
          request: {
            useSsl: true,
          },
        },
        browseId: "FEmusic_history",
      }),
    },
  );

  const data = await musicResponse.json();

  const results: YTAPIResponse =
    data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
      ?.content?.sectionListRenderer?.contents;

  if (!results) {
    throw new Error(
      "Failed to fetch music history, data:\n " + JSON.stringify(data, null, 2),
    );
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
            .musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
        const album =
          browseEndpointFlexColumnAlbum
            ?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]
            ?.text || title;

        if (title && artist && !title.endsWith(" - Topic")) {
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

  return songs;
}

export async function scrobbleSong({
  song,
  lastFmSessionKey,
  lastFmApiKey,
  lastFmApiSecret,
  timestamp,
}: {
  song: { title: string; artist: string; album: string };
  lastFmSessionKey: string;
  lastFmApiKey: string;
  lastFmApiSecret: string;
  timestamp: string;
}) {
  const url = new URL("http://ws.audioscrobbler.com/2.0/");

  const params = {
    album: sanitizeString(song.album),
    api_key: lastFmApiKey,
    method: "track.scrobble",
    timestamp,
    track: sanitizeString(song.title),
    artist: sanitizeString(song.artist),
    sk: lastFmSessionKey,
  };

  const requestHash = hashRequest(params, lastFmApiSecret);

  const urlParams = new URLSearchParams(params);
  urlParams.append("api_sig", requestHash);

  url.search = urlParams.toString();

  const res = await fetch(url, {
    method: "POST",
  });

  const text = await res.text();

  const result: LastFmScrobbleResponse = await parseStringPromise(text);

  const scrobbles = result.lfm.scrobbles?.[0].$;
  const accepted = scrobbles?.accepted;
  const ignored = scrobbles?.ignored;

  if (accepted === "0" && ignored === "0") {
    throw new Error("Error scrobbling song " + song.title);
  } else if (accepted === "0") {
    throw new Error("Song scrobble was ignored " + song.title);
  } else {
    return true;
  }
}
