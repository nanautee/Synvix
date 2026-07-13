import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TranscriptMessage } from "@synvix/shared";
import { buildSystemPrompt, buildUserPrompt, contextToString } from "./prompt";
import type { InterviewContext } from "./provider";
import { registerProviderReset } from "../credentials";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

registerProviderReset(() => {
  client = null;
});

export async function* streamGeminiAnswer(
  context: TranscriptMessage[],
  question: string,
  interviewContext?: InterviewContext
): AsyncGenerator<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: interviewContext?.model || process.env.GEMINI_MODEL || "gemini-2.0-flash",
    systemInstruction: buildSystemPrompt(interviewContext),
  });

  const userPrompt = buildUserPrompt(
    contextToString(context),
    question,
    interviewContext
  );
  const result = await model.generateContentStream(userPrompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}
