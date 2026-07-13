import Groq from "groq-sdk";
import type { TranscriptMessage } from "@synvix/shared";
import { buildSystemPrompt, buildUserPrompt, contextToString } from "./prompt";
import type { InterviewContext } from "./provider";
import { registerProviderReset } from "../credentials";

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");
    client = new Groq({ apiKey });
  }
  return client;
}

registerProviderReset(() => {
  client = null;
});

export async function* streamGroqAnswer(
  context: TranscriptMessage[],
  question: string,
  interviewContext?: InterviewContext
): AsyncGenerator<string> {
  const groq = getClient();
  const userPrompt = buildUserPrompt(
    contextToString(context),
    question,
    interviewContext
  );

  const stream = await groq.chat.completions.create({
    model: interviewContext?.model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
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
