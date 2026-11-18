import { describe, expect, it } from "vitest";

import { DailyStats, dayRange, formatDailyReport } from "../daily-report";

describe("dayRange", () => {
  it("returns yesterday in Argentina time (UTC-3)", () => {
    // 11:00 UTC on 18 Nov = 08:00 in Buenos Aires: yesterday is 17 Nov.
    const { start, end } = dayRange(new Date("2026-11-18T11:00:00Z"), 1);
    expect(start.toISOString()).toBe("2026-11-17T03:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-18T03:00:00.000Z");
  });

  it("uses the local date, not the UTC one, just after UTC midnight", () => {
    // 01:00 UTC on 18 Nov is still 17 Nov (22:00) in Buenos Aires.
    const { start } = dayRange(new Date("2026-11-18T01:00:00Z"), 1);
    expect(start.toISOString()).toBe("2026-11-16T03:00:00.000Z");
  });

  it("follows daylight saving time in zones that have it", () => {
    // Madrid switches from UTC+2 to UTC+1 on 25 Oct 2026: that day is 25 hours.
    const { start, end } = dayRange(
      new Date("2026-10-26T10:00:00Z"),
      1,
      "Europe/Madrid",
    );
    expect(start.toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });
});

describe("formatDailyReport", () => {
  const stats: DailyStats = {
    day: new Date("2026-11-17T03:00:00Z"),
    scrobbles: 12345,
    scrobblesDayBefore: 11000,
    scrobblingUsers: 190,
    newUsers: 3,
    newUsersDayBefore: 5,
    totalUsers: 10284,
    activeUsers: 1200,
    pro: { total: 21, stripe: 1, paddle: 20, endingSoon: 2 },
    newProSubscriptions: 1,
    cookiesExpired: 4,
    lostUsers: { total: 2795, last30Days: 120 },
    supportEmails: 2,
    supportEscalated: 0,
    supportOverLimit: 0,
  };

  it("puts the key numbers in the subject", () => {
    expect(formatDailyReport(stats).subject).toBe(
      "Scrobbler, 17 nov: 12.345 scrobbles, 3 usuarios nuevos",
    );
  });

  it("includes every figure, in a short body", () => {
    const { text } = formatDailyReport(stats);
    for (const expected of [
      "martes, 17 de noviembre",
      "Canciones scrobbleadas: 12.345 (el día anterior: 11.000), de 190 usuarios",
      "Nuevos: 3 (el día anterior: 5)",
      "Total: 10.284, con el scrobbling activado: 1.200",
      "Nuevas: 1",
      "Total: 21 (Stripe 1, Paddle 20), con cancelación programada: 2",
      "Caducaron ayer: 4",
      "Caducadas y sin reconectar: 2.795 (120 en los últimos 30 días)",
      "Correos recibidos: 2, escalados a ti: 0",
      "Responde a este correo",
    ]) {
      expect(text).toContain(expected);
    }
    expect(text.split("\n").length).toBeLessThan(25);
  });

  it("mentions emails left unanswered by the reply limit only when there are some", () => {
    expect(formatDailyReport(stats).text).not.toContain("límite");
    expect(formatDailyReport({ ...stats, supportOverLimit: 2 }).text).toContain(
      "sin responder por superar el límite diario: 2",
    );
  });

  it("says when new subscriptions could not be read from Stripe", () => {
    const { text } = formatDailyReport({ ...stats, newProSubscriptions: null });
    expect(text).toContain("Nuevas: n/d");
  });
});
