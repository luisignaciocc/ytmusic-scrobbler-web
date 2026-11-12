/**
 * Checks what a user pasted as their YouTube Music cookie before it is
 * saved, so that an obviously wrong paste is caught right away instead of
 * failing silently on the next scrobble.
 */

/** YouTube Music requests are signed with one of these; without it they fail. */
const SIGNING_KEYS = ["SAPISID", "__Secure-3PAPISID"];

export type CookieCheck =
  | { ok: true; cookie: string }
  | { ok: false; problem: string };

export function checkYtmusicCookie(raw: string): CookieCheck {
  // People often copy the header name along with its value.
  const cookie = raw.trim().replace(/^cookie:\s*/i, "").trim();

  if (!cookie) {
    return { ok: false, problem: "Paste the cookie value first." };
  }

  const names = cookie
    .split(";")
    .map((pair) => pair.trim())
    .filter((pair) => pair.includes("="))
    .map((pair) => pair.slice(0, pair.indexOf("=")));

  if (names.length === 0) {
    return {
      ok: false,
      problem:
        "This doesn't look like a cookie. It should be a long line of name=value pairs separated by semicolons.",
    };
  }

  if (!SIGNING_KEYS.some((key) => names.includes(key))) {
    return {
      ok: false,
      problem:
        "This cookie is missing the part that proves you are signed in (SAPISID). Make sure you are signed in to YouTube Music and copy the whole Cookie value of a 'browse' request, from start to end.",
    };
  }

  return { ok: true, cookie };
}
