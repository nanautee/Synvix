import Groq from "groq-sdk";
import type { TranscriptMessage } from "@synvix/shared";
import { buildSystemPrompt, buildUserPrompt, contextToString } from "./prompt";
import type { InterviewContext } from "./provider";
import { registerProviderReset } from "../credentials";

let client: Groq | null = null;
let clientBaseUrl = "";

function getClient(baseUrl?: string): Groq {
  const normalized = baseUrl?.trim() || "";
  if (!client || normalized !== clientBaseUrl) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");
    client = new Groq({ apiKey, ...(normalized ? { baseURL: normalized } : {}) });
    clientBaseUrl = normalized;
  }
  return client;
}

registerProviderReset(() => {
  client = null;
  clientBaseUrl = "";
});

export async function* streamGroqAnswer(
  context: TranscriptMessage[],
  question: string,
  interviewContext?: InterviewContext
): AsyncGenerator<string> {
  const groq = getClient(interviewContext?.baseUrl);
  const userPrompt = buildUserPrompt(
    contextToString(context),
    question,
    interviewContext
  );

  const stream = await groq.chat.completions.create({
    model: interviewContext?.model || process.env.GROQ_MODEL || "openai/gpt-oss-120b",
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
