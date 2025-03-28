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
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0",
      accept: "*/*",
      "accept-encoding": "gzip, deflate",
      "content-type": "application/json",
      "content-encoding": "gzip",
      origin: "https://music.youtube.com",
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

function sapisidFromCookie(rawCookie: string): string {
  const match = rawCookie.match(/__Secure-3PAPISID=([^;]+)/);
  if (!match) {
    throw new Error(
      "Your cookie is missing the required value __Secure-3PAPISID",
    );
  }
  return match[1];
}

function initializeContext() {
  const date = new Date();
  const formattedDate =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2);

  return {
    context: {
      client: {
        clientName: "WEB_REMIX",
        clientVersion: "1." + formattedDate + ".01.00",
        hl: "en",
        gl: "US",
      },
      user: {},
    },
  };
}

function getAuthorization(auth: string): string {
  const unixTimestamp = Math.floor(Date.now() / 1000).toString();
  const data = unixTimestamp + " " + auth;
  const hash = crypto.createHash("sha1").update(data).digest("hex");
  return "SAPISIDHASH " + unixTimestamp + "_" + hash;
}

export async function getYTMusicHistory({
  cookie,
  authUser,
}: {
  cookie: string;
  authUser: string;
}) {
  const sapisid = sapisidFromCookie(cookie);
  const context = initializeContext();
  const origin = "https://music.youtube.com";
  const authorization = getAuthorization(sapisid + " " + origin);
  const visitorId = await getGoogleVisitorId();

  const requestHeaders: { [key: string]: string } = {
    accept: "*/*",
    "accept-encoding": "gzip, deflate",
    "accept-language": "en-US,en;q=0.9",
    authorization,
    "content-type": "application/json",
    cookie,
    origin,
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0",
    "x-goog-authuser": authUser,
    "x-origin": origin,
  };

  if (visitorId) {
    requestHeaders["x-goog-visitor-id"] = visitorId;
  }

  // Añadir cookie SOCS
  const cookies = new Map();
  cookie.split(";").forEach((pair) => {
    const [name, ...rest] = pair.trim().split("=");
    cookies.set(name, rest.join("="));
  });
  if (!cookies.has("SOCS")) {
    cookie += "; SOCS=CAI";
  }

  try {
    const requestBody = {
      browseId: "FEmusic_history",
      ...context,
    };

    const musicResponse = await fetch(
      "https://music.youtube.com/youtubei/v1/browse?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30",
      {
        method: "POST",
        cache: "no-store",
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
        credentials: "include",
      },
    );

    if (!musicResponse.ok) {
      const data = await musicResponse.text();
      const errorInfo = {
        message: "Failed to fetch music history",
        data,
        headers: requestHeaders,
        body: JSON.stringify(requestBody, null, 2),
        status: musicResponse.status,
        statusText: musicResponse.statusText,
      };
      throw errorInfo;
    }

    const data = await musicResponse.json();

    const results: YTAPIResponse =
      data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
        ?.content?.sectionListRenderer?.contents;

    if (!results) {
      const errorInfo = {
        message: "Failed to fetch music history",
        data: JSON.stringify(data, null, 2),
        headers: requestHeaders,
        body: JSON.stringify(requestBody, null, 2),
      };
      throw errorInfo;
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
  } catch (error) {
    // Si el error ya tiene la propiedad headers, significa que es nuestro error personalizado
    if (error.headers) {
      throw error;
    }

    // Si es otro tipo de error, agregar los headers al objeto de error
    const errorWithHeaders = {
      message: error.message || "Error desconocido en getYTMusicHistory",
      originalError: error,
      headers: requestHeaders,
    };

    throw errorWithHeaders;
  }
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
