import { describe, expect, it } from "vitest";

import { checkYtmusicCookie } from "../apps/web/lib/ytmusic-cookie";

const VALID = "SID=abc; HSID=def; SAPISID=ghi/jkl; __Secure-3PSID=mno";

describe("checkYtmusicCookie", () => {
  it("accepts a cookie that carries the signing key", () => {
    expect(checkYtmusicCookie(VALID)).toEqual({ ok: true, cookie: VALID });
  });

  it("accepts the __Secure-3PAPISID variant", () => {
    const cookie = "SID=abc; __Secure-3PAPISID=xyz";
    expect(checkYtmusicCookie(cookie)).toEqual({ ok: true, cookie });
  });

  it("strips a copied header name and surrounding whitespace", () => {
    expect(checkYtmusicCookie(`  Cookie: ${VALID}\n`)).toEqual({
      ok: true,
      cookie: VALID,
    });
  });

  it("rejects an empty paste", () => {
    expect(checkYtmusicCookie("   ").ok).toBe(false);
  });

  it("rejects text that is not a cookie", () => {
    const result = checkYtmusicCookie("https://music.youtube.com/");
    expect(result.ok).toBe(false);
  });

  it("rejects a cookie without the signing key and says why", () => {
    const result = checkYtmusicCookie("VISITOR_INFO1_LIVE=abc; PREF=tz=UTC");
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.problem).toContain("SAPISID");
  });

  it("does not treat a similarly named cookie as the signing key", () => {
    expect(checkYtmusicCookie("NOTSAPISID=abc; SID=def").ok).toBe(false);
  });
});
