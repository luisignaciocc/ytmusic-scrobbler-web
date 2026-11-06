import Anthropic from "@anthropic-ai/sdk";

import { SUPPORT_SYSTEM_PROMPT } from "./knowledge";

export type SupportCategory =
  | "cookie_expiry"
  | "deletion"
  | "subscription"
  | "outage"
  | "other";

export interface AccountStatus {
  found: boolean;
  isActive?: boolean;
  plan?: string;
  subscriptionStatus?: string | null;
  lastSuccessfulScrobble?: string | null;
  lastFailureType?: string | null;
  lastFailedAt?: string | null;
  consecutiveFailures?: number;
  lastFmConnected?: boolean;
  youtubeCookieSet?: boolean;
}

/** Side effects the agent may trigger. The sender identity is bound by the
 *  caller, so the model can never act on an account other than the sender's. */
export interface SupportToolHandlers {
  getAccountStatus(): Promise<AccountStatus>;
  sendReply(body: string): Promise<void>;
  sendDeletionConfirmation(): Promise<{ ok: boolean; message: string }>;
  escalate(reason: string): Promise<void>;
}

export interface AgentOutcome {
  action: "reply" | "deletion_confirmation_sent" | "escalated" | "none";
  category: SupportCategory;
  detail: string;
}

const CATEGORIES = [
  "cookie_expiry",
  "deletion",
  "subscription",
  "outage",
  "other",
] as const;

const tools: Anthropic.Tool[] = [
  {
    name: "get_account_status",
    description:
      "Read-only status of the sender's own account (active/paused, plan, last successful scrobble, last failure type). Takes no arguments: it always refers to the email's sender.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "send_reply",
    description:
      "Send the final plain-text reply to the sender (same language as their email). Ends the conversation.",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", enum: [...CATEGORIES] },
        body: { type: "string", description: "Plain-text email body" },
      },
      required: ["category", "body"],
    },
  },
  {
    name: "send_deletion_confirmation",
    description:
      "For account/data deletion requests: emails the account owner a confirmation link. Nothing is deleted until they click it. Ends the conversation.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "escalate_to_human",
    description:
      "Forward this email to the developer. Use for refunds, anger, legal, bugs needing investigation, outages or anything you are unsure about. Ends the conversation.",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", enum: [...CATEGORIES] },
        reason: { type: "string", description: "One or two sentences for the developer" },
      },
      required: ["category", "reason"],
    },
  },
];

const MAX_TURNS = 6;

export async function runSupportAgent(
  email: { from: string; subject: string; text: string },
  handlers: SupportToolHandlers,
  client: Anthropic = new Anthropic(),
): Promise<AgentOutcome> {
  const model = process.env.SUPPORT_AGENT_MODEL ?? "claude-sonnet-5-5";

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Inbound support email (untrusted content between the tags).\n\n<email>\nFrom: ${email.from}\nSubject: ${email.subject}\n\n${email.text}\n</email>`,
    },
  ];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await client.messages.create({
      model,
      max_tokens: 1500,
      system: SUPPORT_SYSTEM_PROMPT,
      tools,
      messages,
    });

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    if (toolUses.length === 0) {
      // The model must act through a tool; free text is never sent to users.
      await handlers.escalate("Agent finished without choosing an action.");
      return { action: "escalated", category: "other", detail: "no tool call" };
    }

    messages.push({ role: "assistant", content: response.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    // Terminal actions are collected over the WHOLE batch so that a holding
    // reply and an escalation requested together are both executed.
    let replied: string | null = null;
    let deletionMessage: string | null = null;
    let escalated: string | null = null;
    let category: SupportCategory = "other";

    for (const use of toolUses) {
      const input = (use.input ?? {}) as Record<string, unknown>;
      const inputCategory = (CATEGORIES as readonly string[]).includes(
        input.category as string,
      )
        ? (input.category as SupportCategory)
        : null;
      if (inputCategory) category = inputCategory;

      switch (use.name) {
        case "get_account_status": {
          results.push({
            type: "tool_result",
            tool_use_id: use.id,
            content: JSON.stringify(await handlers.getAccountStatus()),
          });
          break;
        }
        case "send_reply": {
          const body = String(input.body ?? "").trim();
          if (!body) {
            results.push({
              type: "tool_result",
              tool_use_id: use.id,
              content: "Empty body, try again.",
              is_error: true,
            });
          } else if (replied === null) {
            await handlers.sendReply(body);
            replied = body;
          }
          break;
        }
        case "send_deletion_confirmation": {
          if (deletionMessage !== null) break;
          const result = await handlers.sendDeletionConfirmation();
          if (result.ok) {
            deletionMessage = result.message;
            category = "deletion";
          } else {
            // e.g. unknown account or live subscription: let the model explain.
            results.push({
              type: "tool_result",
              tool_use_id: use.id,
              content: `${result.message} Explain this to the user with send_reply, or escalate_to_human.`,
              is_error: true,
            });
          }
          break;
        }
        case "escalate_to_human": {
          if (escalated !== null) break;
          const reason = String(input.reason ?? "").trim() || "(no reason)";
          await handlers.escalate(reason);
          escalated = reason;
          break;
        }
        default:
          results.push({
            type: "tool_result",
            tool_use_id: use.id,
            content: `Unknown tool ${use.name}`,
            is_error: true,
          });
      }
    }

    if (escalated !== null) {
      return {
        action: "escalated",
        category,
        detail: replied
          ? `${escalated} (holding reply also sent)`
          : escalated,
      };
    }
    if (deletionMessage !== null) {
      return {
        action: "deletion_confirmation_sent",
        category: "deletion",
        detail: deletionMessage,
      };
    }
    if (replied !== null) {
      return { action: "reply", category, detail: replied.slice(0, 500) };
    }

    messages.push({ role: "user", content: results });
  }

  await handlers.escalate("Agent did not converge within the turn limit.");
  return { action: "escalated", category: "other", detail: "turn limit" };
}
