/* eslint-disable no-console */
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
      `Headers.append: '${rawCookie}' is an invalid header value for the 'Cookie' header. Your cookie is missing the required value __Secure-3PAPISID`,
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

function processCookieForRequest(cookie: string): string {
  const cookies = new Map();
  cookie.split(";").forEach((pair) => {
    const [name, ...rest] = pair.trim().split("=");
    cookies.set(name, rest.join("="));
  });

  if (!cookies.has("SOCS")) {
    return cookie + "; SOCS=CAI";
  }

  return cookie;
}

async function buildYTMusicRequestHeaders(
  cookie: string,
): Promise<{ [key: string]: string }> {
  const sapisid = sapisidFromCookie(cookie);
  const origin = "https://music.youtube.com";
  const authorization = getAuthorization(sapisid + " " + origin);
  const visitorId = await getGoogleVisitorId();
  const processedCookie = processCookieForRequest(cookie);

  const headers: { [key: string]: string } = {
    accept: "*/*",
    "accept-encoding": "gzip, deflate",
    "accept-language": "en-US,en;q=0.9",
    authorization,
    "content-type": "application/json",
    cookie: processedCookie,
    origin,
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0",
    "x-goog-authuser": "0",
    "x-origin": origin,
  };

  if (visitorId) {
    headers["x-goog-visitor-id"] = visitorId;
  }

  return headers;
}

export async function fetchYTMusicHistoryPage(cookie: string): Promise<string> {
  const processedCookie = processCookieForRequest(cookie);

  const response = await fetch("https://music.youtube.com/history", {
    method: "GET",
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9,es;q=0.8,pt;q=0.7",
      "cache-control": "no-cache",
      cookie: processedCookie,
      pragma: "no-cache",
      priority: "u=0, i",
      "sec-ch-ua":
        '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
      "sec-ch-ua-arch": '"x86"',
      "sec-ch-ua-bitness": '"64"',
      "sec-ch-ua-form-factors": '"Desktop"',
      "sec-ch-ua-full-version": '"139.0.7258.154"',
      "sec-ch-ua-full-version-list":
        '"Not;A=Brand";v="99.0.0.0", "Google Chrome";v="139.0.7258.154", "Chromium";v="139.0.7258.154"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": '""',
      "sec-ch-ua-platform": '"Linux"',
      "sec-ch-ua-platform-version": '"6.14.0"',
      "sec-ch-ua-wow64": "?0",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
      "x-browser-channel": "stable",
      "x-browser-copyright": "Copyright 2025 Google LLC. All rights reserved.",
      "x-browser-validation": "OhMsc7acNx+0w+NEQM7p961tYAw=",
      "x-browser-year": "2025",
      "x-client-data":
        "CI62yQEIorbJAQipncoBCMPgygEIlqHLAQjGo8sBCIegzQEIqvnOAQiAhM8BCJSEzwEI2YTPAQi1hc8BGM2CzwEY14bPAQ==",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to fetch YouTube Music history page: ${response.status} ${response.statusText}\n${error}`,
    );
  }

  return await response.text();
}

function decodeHexString(hexStr: string): string {
  return hexStr.replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}

function sanitizeJsonString(jsonStr: string): string {
  // This function handles unescaped quotes in JSON strings (particularly in song titles)
  // We need to be very careful to only escape quotes that are not already properly escaped
  // and are not part of the JSON structure (like object/array syntax)

  let result = "";
  let inString = false;
  let escapeNext = false;
  let stringChar = "";

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      escapeNext = true;
      continue;
    }

    if (!inString) {
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        result += char;
      } else {
        result += char;
      }
    } else {
      if (char === stringChar) {
        // Check if this quote should end the string or be escaped
        // Look ahead to see what comes after this quote
        let shouldEndString = false;

        // Skip whitespace to see what comes next
        let nextNonWhitespace = "";
        let nextIndex = i + 1;
        while (nextIndex < jsonStr.length && /\s/.test(jsonStr[nextIndex])) {
          nextIndex++;
        }
        if (nextIndex < jsonStr.length) {
          nextNonWhitespace = jsonStr[nextIndex];
        }

        // If followed by valid JSON syntax, this should end the string
        if (
          nextNonWhitespace === "," ||
          nextNonWhitespace === "}" ||
          nextNonWhitespace === "]" ||
          nextNonWhitespace === ":" ||
          nextIndex >= jsonStr.length
        ) {
          shouldEndString = true;
        }

        if (shouldEndString) {
          inString = false;
          stringChar = "";
          result += char;
        } else {
          // This quote is inside a string value and should be escaped
          result += "\\" + char;
        }
      } else {
        result += char;
      }
    }
  }

  return result;
}

function extractInitialDataFromPage(html: string): unknown | null {
  console.log("Searching for initialData in HTML...");

  // Buscar todos los initialData.push de una forma más flexible
  const allPushRegex = /initialData\.push\(\{[^}]*data:\s*'([^']+)'/g;
  const matches = [...html.matchAll(allPushRegex)];

  console.log(`Found ${matches.length} initialData.push entries`);

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const hexData = match[1];

    console.log(`Trying to parse entry ${i + 1}...`);
    console.log(`Hex data length: ${hexData.length} characters`);
    console.log(`First 100 chars: ${hexData.substring(0, 100)}`);

    try {
      // Decodificar de hex a string
      const decodedData = decodeHexString(hexData);
      console.log(`Decoded data length: ${decodedData.length} characters`);
      console.log(`First 100 decoded chars: ${decodedData.substring(0, 100)}`);

      // Verificar si es JSON válido antes de parsear
      if (!decodedData.startsWith("{") && !decodedData.startsWith("[")) {
        console.log(
          `Entry ${i + 1}: Not valid JSON (doesn't start with { or [)`,
        );
        continue;
      }

      // Sanitizar y parsear el JSON
      const sanitizedData = sanitizeJsonString(decodedData);
      const parsed = JSON.parse(sanitizedData);
      console.log(`Entry ${i + 1}: Successfully parsed JSON`);

      // Verificar si contiene datos del historial
      const hasHistoryData =
        JSON.stringify(parsed).includes("singleColumnBrowseResultsRenderer") ||
        JSON.stringify(parsed).includes("musicShelfRenderer") ||
        JSON.stringify(parsed).includes("FEmusic_history");

      if (hasHistoryData) {
        console.log(`Entry ${i + 1}: Contains history data! Using this entry.`);
        return parsed;
      } else {
        console.log(
          `Entry ${i + 1}: Doesn't contain history data, continuing...`,
        );
      }
    } catch (error) {
      console.log(`Entry ${i + 1}: Error parsing -`, error.message);

      // Intentar limpiar el JSON
      try {
        const decodedData = decodeHexString(hexData);
        // Intentar arreglar JSON malformado quitando caracteres al final
        let cleanedData = decodedData.trim();

        // Si termina con coma, quitarla
        if (cleanedData.endsWith(",")) {
          cleanedData = cleanedData.slice(0, -1);
        }

        // Si no tiene cierre de bracket/brace, intentar cerrarlos
        const openBraces = (cleanedData.match(/\{/g) || []).length;
        const closeBraces = (cleanedData.match(/\}/g) || []).length;
        const openBrackets = (cleanedData.match(/\[/g) || []).length;
        const closeBrackets = (cleanedData.match(/\]/g) || []).length;

        if (openBraces > closeBraces) {
          cleanedData += "}".repeat(openBraces - closeBraces);
        }
        if (openBrackets > closeBrackets) {
          cleanedData += "]".repeat(openBrackets - closeBrackets);
        }

        const cleaned = JSON.parse(cleanedData);
        console.log(`Entry ${i + 1}: Successfully cleaned and parsed!`);

        const hasHistoryData =
          JSON.stringify(cleaned).includes(
            "singleColumnBrowseResultsRenderer",
          ) ||
          JSON.stringify(cleaned).includes("musicShelfRenderer") ||
          JSON.stringify(cleaned).includes("FEmusic_history");

        if (hasHistoryData) {
          console.log(
            `Entry ${i + 1}: Cleaned version contains history data! Using this entry.`,
          );
          return cleaned;
        }
      } catch (cleanError) {
        console.log(
          `Entry ${i + 1}: Cleaning also failed -`,
          cleanError.message,
        );
        continue;
      }
    }
  }

  console.log("No valid history data found in any entry");
  return null;
}

export function parseYTMusicPageResponse(html: string): {
  title: string;
  artist: string;
  album: string;
  playedAt?: string;
}[] {
  const initialData = extractInitialDataFromPage(html);

  if (!initialData) {
    throw new Error("No initial data found in page");
  }

  // Usar la función parseYTMusicResponse existente
  return parseYTMusicResponse(initialData);
}

export async function getYTMusicHistoryFromPage({
  cookie,
}: {
  cookie: string;
}) {
  const html = await fetchYTMusicHistoryPage(cookie.trim());
  return parseYTMusicPageResponse(html);
}

export async function fetchYTMusicHistory(cookie: string): Promise<unknown> {
  const requestHeaders = await buildYTMusicRequestHeaders(cookie);
  const context = initializeContext();

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
    const error = await musicResponse.text();
    throw new Error(
      error +
        "\n\n" +
        JSON.stringify(requestBody, null, 2) +
        "\n\n" +
        JSON.stringify(requestHeaders, null, 2),
    );
  }

  return await musicResponse.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseYTMusicResponse(data: any): {
  title: string;
  artist: string;
  album: string;
  playedAt?: string;
}[] {
  const results: YTAPIResponse =
    data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
      ?.content?.sectionListRenderer?.contents;

  if (!results) {
    throw new Error("No results found");
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

export async function getYTMusicHistory({ cookie }: { cookie: string }) {
  const data = await fetchYTMusicHistory(cookie.trim());
  return parseYTMusicResponse(data);
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
    return false;
  } else if (accepted === "0") {
    return false;
  } else {
    return true;
  }
}
