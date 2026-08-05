import Anthropic from "@anthropic-ai/sdk";
import type { TranscriptMessage } from "@synvix/shared";
import { buildSystemPrompt, buildUserPrompt, contextToString } from "./prompt";
import type { InterviewContext } from "./provider";
import { registerProviderReset } from "../credentials";

let client: Anthropic | null = null;
let clientBaseUrl = "";

function getClient(baseUrl?: string): Anthropic {
  const normalized = baseUrl?.trim() || "";
  if (!client || normalized !== clientBaseUrl) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey, ...(normalized ? { baseURL: normalized } : {}) });
    clientBaseUrl = normalized;
  }
  return client;
}

registerProviderReset(() => {
  client = null;
  clientBaseUrl = "";
});

export async function* streamClaudeAnswer(
  context: TranscriptMessage[],
  question: string,
  interviewContext?: InterviewContext
): AsyncGenerator<string> {
  const anthropic = getClient(interviewContext?.baseUrl);
  const userPrompt = buildUserPrompt(
    contextToString(context),
    question,
    interviewContext
  );

  const stream = anthropic.messages.stream({
    model: interviewContext?.model || process.env.CLAUDE_MODEL || "claude-3-5-haiku-20241022",
    max_tokens: 600,
    system: buildSystemPrompt(interviewContext),
    messages: [{ role: "user", content: userPrompt }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
