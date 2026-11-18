import { describe, expect, it } from "vitest";

import {
  createDeletionToken,
  hasLiveSubscription,
  parseAddress,
  quoteOriginal,
  shouldSkipAutoReply,
  verifyDeletionToken,
} from "../apps/web/lib/support/guards";

process.env.SUPPORT_TOKEN_SECRET = "test-secret";

describe("parseAddress", () => {
  it("extracts and lowercases", () => {
    expect(parseAddress("Ana <Ana@Example.COM>")).toBe("ana@example.com");
    expect(parseAddress("bob@x.com")).toBe("bob@x.com");
  });
});

describe("shouldSkipAutoReply", () => {
  const base = { headers: {}, ownDomains: ["bocono-labs.com"] };
  it("allows a normal human email", () => {
    expect(shouldSkipAutoReply({ ...base, from: "Ana <ana@gmail.com>" })).toBeNull();
  });
  it("blocks noreply, own domain, auto-submitted and bulk mail", () => {
    expect(shouldSkipAutoReply({ ...base, from: "noreply@x.com" })).toBeTruthy();
    expect(shouldSkipAutoReply({ ...base, from: "support@bocono-labs.com" })).toBeTruthy();
    expect(
      shouldSkipAutoReply({ ...base, from: "a@b.com", headers: { "Auto-Submitted": "auto-replied" } }),
    ).toBeTruthy();
    expect(
      shouldSkipAutoReply({ ...base, from: "a@b.com", headers: { Precedence: "bulk" } }),
    ).toBeTruthy();
  });
});

describe("deletion tokens", () => {
  it("round-trips", () => {
    expect(verifyDeletionToken(createDeletionToken("user_1"))).toBe("user_1");
  });
  it("rejects tampering and expiry", () => {
    const token = createDeletionToken("user_1");
    expect(verifyDeletionToken(token + "x")).toBeNull();
    expect(verifyDeletionToken("garbage")).toBeNull();
    const other = createDeletionToken("user_2");
    expect(verifyDeletionToken(other.split(".")[0] + "." + token.split(".")[1])).toBeNull();
    expect(verifyDeletionToken(token, Date.now() + 49 * 3600 * 1000)).toBeNull();
  });
});

describe("hasLiveSubscription", () => {
  it("detects live subs only", () => {
    expect(hasLiveSubscription({ subscriptionId: "s", subscriptionStatus: "active" })).toBe(true);
    expect(hasLiveSubscription({ subscriptionId: "s", subscriptionStatus: "cancelled" })).toBe(false);
    expect(hasLiveSubscription({ subscriptionId: null, subscriptionStatus: "active" })).toBe(false);
  });
});

describe("quoteOriginal", () => {
  const from = "Julia <julia@example.com>";

  it("appends the original message quoted, with sender and date", () => {
    const result = quoteOriginal("Hi Julia,\n\nYes, that's right.\n", {
      from,
      text: "Did I do it right?\nThanks",
      date: "2026-11-18T18:01:50.000Z",
    });
    expect(result).toBe(
      "Hi Julia,\n\nYes, that's right.\n\n" +
        "On Wed, 18 Nov 2026 18:01:50 UTC, Julia <julia@example.com> wrote:\n" +
        "> Did I do it right?\n> Thanks\n",
    );
  });

  it("leaves out the date when it is missing or invalid", () => {
    for (const date of [undefined, null, "not a date"]) {
      expect(quoteOriginal("Reply", { from, text: "Hello", date })).toBe(
        "Reply\n\nJulia <julia@example.com> wrote:\n> Hello\n",
      );
    }
  });

  it("keeps blank lines and nests text that was already quoted", () => {
    const result = quoteOriginal("Reply", {
      from,
      text: "Thanks!\r\n\r\nOn Mon, someone wrote:\r\n> earlier answer",
    });
    expect(result).toBe(
      "Reply\n\nJulia <julia@example.com> wrote:\n" +
        "> Thanks!\n>\n> On Mon, someone wrote:\n>> earlier answer\n",
    );
  });

  it("returns the reply unchanged when the original has no text", () => {
    expect(quoteOriginal("Reply", { from, text: "  \n " })).toBe("Reply");
  });
});
