import Anthropic from "@anthropic-ai/sdk";
import type { TranscriptMessage } from "@synvix/shared";
import { SYSTEM_PROMPT, buildUserPrompt, contextToString } from "./prompt";
import { registerProviderReset } from "../credentials";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

registerProviderReset(() => {
  client = null;
});

export async function* streamClaudeAnswer(
  context: TranscriptMessage[],
  question: string
): AsyncGenerator<string> {
  const anthropic = getClient();
  const userPrompt = buildUserPrompt(contextToString(context), question);

  const stream = anthropic.messages.stream({
    model: process.env.CLAUDE_MODEL || "claude-3-5-haiku-latest",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
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
