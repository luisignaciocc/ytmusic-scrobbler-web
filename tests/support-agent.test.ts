import { describe, expect, it, vi } from "vitest";

import { runSupportAgent, SupportToolHandlers } from "../apps/web/lib/support/agent";

function fakeClient(responses: Array<Array<{ name: string; input: object }>>) {
  let i = 0;
  return {
    messages: {
      create: vi.fn(async () => ({
        content: responses[i++].map((u, n) => ({
          type: "tool_use",
          id: `t${i}_${n}`,
          name: u.name,
          input: u.input,
        })),
      })),
    },
  } as never;
}

function handlers(over: Partial<SupportToolHandlers> = {}): SupportToolHandlers {
  return {
    getAccountStatus: vi.fn(async () => ({ found: true })),
    sendReply: vi.fn(async () => undefined),
    sendDeletionConfirmation: vi.fn(async () => ({ ok: true, message: "sent" })),
    escalate: vi.fn(async () => undefined),
    ...over,
  };
}

const email = { from: "a@b.com", subject: "hi", text: "help" };

describe("runSupportAgent", () => {
  it("executes both a holding reply and an escalation from the same batch", async () => {
    const h = handlers();
    const out = await runSupportAgent(
      email,
      h,
      fakeClient([
        [
          { name: "send_reply", input: { category: "other", body: "We got it" } },
          { name: "escalate_to_human", input: { category: "other", reason: "refund" } },
        ],
      ]),
    );
    expect(h.sendReply).toHaveBeenCalledOnce();
    expect(h.escalate).toHaveBeenCalledWith("refund");
    expect(out.action).toBe("escalated");
  });

  it("lets the model explain a failed deletion and then reply", async () => {
    const h = handlers({
      sendDeletionConfirmation: vi.fn(async () => ({ ok: false, message: "no account" })),
    });
    const out = await runSupportAgent(
      email,
      h,
      fakeClient([
        [{ name: "send_deletion_confirmation", input: {} }],
        [{ name: "send_reply", input: { category: "deletion", body: "No account found" } }],
      ]),
    );
    expect(h.sendReply).toHaveBeenCalledOnce();
    expect(out.action).toBe("reply");
  });

  it("escalates instead of sending free text when no tool is called", async () => {
    const h = handlers();
    const out = await runSupportAgent(email, h, fakeClient([[]]));
    expect(h.sendReply).not.toHaveBeenCalled();
    expect(h.escalate).toHaveBeenCalledOnce();
    expect(out.action).toBe("escalated");
  });
});
