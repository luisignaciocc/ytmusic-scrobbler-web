import { describe, expect, it, vi } from "vitest";

import { runAnalystAgent } from "../apps/web/lib/analyst/agent";
import { runReadOnlyQuery } from "../apps/web/lib/analyst/sql";

type Block =
  | { type: "tool_use"; name: string; input: object }
  | { type: "text"; text: string };

function fakeClient(turns: Block[][]) {
  let i = 0;
  return {
    messages: {
      create: vi.fn(async () => ({
        content: turns[i++].map((b, n) =>
          b.type === "tool_use" ? { ...b, id: `t${i}_${n}` } : b,
        ),
      })),
    },
  } as never;
}

const email = { subject: "Re: Scrobbler, 17 nov", text: "¿Cuántos usuarios Pro hay?" };

describe("runAnalystAgent", () => {
  it("queries, then sends one answer and returns it", async () => {
    const runSql = vi.fn(async () => ({ ok: true, result: '[{"count":21}]' }));
    const sendAnswer = vi.fn(async () => undefined);
    const answer = await runAnalystAgent(
      email,
      { runSql, sendAnswer },
      fakeClient([
        [{ type: "tool_use", name: "run_sql", input: { sql: 'SELECT COUNT(*) FROM "User"' } }],
        [{ type: "tool_use", name: "send_answer", input: { body: "Hay 21 usuarios Pro." } }],
      ]),
    );
    expect(runSql).toHaveBeenCalledWith('SELECT COUNT(*) FROM "User"');
    expect(sendAnswer).toHaveBeenCalledTimes(1);
    expect(sendAnswer).toHaveBeenCalledWith("Hay 21 usuarios Pro.");
    expect(answer).toBe("Hay 21 usuarios Pro.");
  });

  it("passes SQL errors back to the model so it can retry", async () => {
    const runSql = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, result: "permission denied" })
      .mockResolvedValueOnce({ ok: true, result: "[]" });
    const client = fakeClient([
      [{ type: "tool_use", name: "run_sql", input: { sql: "bad" } }],
      [{ type: "tool_use", name: "run_sql", input: { sql: "good" } }],
      [{ type: "tool_use", name: "send_answer", input: { body: "Ninguno." } }],
    ]);
    await runAnalystAgent(email, { runSql, sendAnswer: vi.fn(async () => undefined) }, client);
    const second = (client as unknown as { messages: { create: ReturnType<typeof vi.fn> } })
      .messages.create.mock.calls[1][0] as { messages: Array<{ content: unknown }> };
    // [question, first tool call, its result]: the array is shared across
    // calls, so look at the entry by position.
    expect(JSON.stringify(second.messages[2].content)).toContain('"is_error":true');
  });

  it("sends plain text when the model answers without the tool", async () => {
    const sendAnswer = vi.fn(async () => undefined);
    const answer = await runAnalystAgent(
      email,
      { runSql: vi.fn(), sendAnswer },
      fakeClient([[{ type: "text", text: "Hay 21." }]]),
    );
    expect(sendAnswer).toHaveBeenCalledWith("Hay 21.");
    expect(answer).toBe("Hay 21.");
  });
});

describe("runReadOnlyQuery", () => {
  it("refuses more than one statement before touching the database", async () => {
    const result = await runReadOnlyQuery('SELECT 1; DELETE FROM "User"');
    expect(result.ok).toBe(false);
    expect(result.result).toContain("One statement");
  });

  it("refuses an empty query", async () => {
    expect((await runReadOnlyQuery("  ;  ")).ok).toBe(false);
  });
});
