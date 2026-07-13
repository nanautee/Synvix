import type { LLMProvider, TranscriptMessage } from "@synvix/shared";
import { streamGeminiAnswer } from "./gemini";
import { streamGroqAnswer } from "./groq";
import { streamClaudeAnswer } from "./claude";
import { streamOpenAIAnswer } from "./openai";

export interface InterviewContext {
  position?: string;
  techStack?: string;
  model?: string;
}

export async function* streamAnswer(
  provider: LLMProvider,
  context: TranscriptMessage[],
  question: string,
  interviewContext?: InterviewContext
): AsyncGenerator<string> {
  switch (provider) {
    case "gemini":
      yield* streamGeminiAnswer(context, question, interviewContext);
      break;
    case "groq":
      yield* streamGroqAnswer(context, question, interviewContext);
      break;
    case "claude":
      yield* streamClaudeAnswer(context, question, interviewContext);
      break;
    case "openai":
      yield* streamOpenAIAnswer(context, question, interviewContext);
      break;
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

export function validateLLMProvider(provider: LLMProvider): void {
  const keyMap: Record<LLMProvider, string> = {
    gemini: "GEMINI_API_KEY",
    groq: "GROQ_API_KEY",
    claude: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
  };
  const envKey = keyMap[provider];
  if (!process.env[envKey]) {
    throw new Error(`${envKey} is not configured on the server`);
  }
}
