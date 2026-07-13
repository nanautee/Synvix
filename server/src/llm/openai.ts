import OpenAI from "openai";
import type { TranscriptMessage } from "@synvix/shared";
import { buildSystemPrompt, buildUserPrompt, contextToString } from "./prompt";
import type { InterviewContext } from "./provider";
import { registerProviderReset } from "../credentials";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    client = new OpenAI({ apiKey });
  }
  return client;
}

registerProviderReset(() => {
  client = null;
});

export async function* streamOpenAIAnswer(
  context: TranscriptMessage[],
  question: string,
  interviewContext?: InterviewContext
): AsyncGenerator<string> {
  const openai = getClient();
  const userPrompt = buildUserPrompt(
    contextToString(context),
    question,
    interviewContext
  );

  const stream = await openai.chat.completions.create({
    model: interviewContext?.model || process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: buildSystemPrompt(interviewContext) },
      { role: "user", content: userPrompt },
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 600,
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) yield token;
  }
}
