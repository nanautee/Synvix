import type { STTProvider } from "@synvix/shared";
import { transcribeAudio as transcribeOpenAI } from "./whisper";
import { transcribeWithGroq } from "./groq";

export async function transcribe(
  provider: STTProvider,
  buffer: Buffer,
  mimeType: string,
  model?: string
): Promise<string> {
  switch (provider) {
    case "groq":
      return transcribeWithGroq(buffer, mimeType, model);
    case "openai":
      return transcribeOpenAI(buffer, mimeType, model);
    default:
      throw new Error(`Unknown STT provider: ${provider}`);
  }
}

export function validateSTTProvider(provider: STTProvider): void {
  const keyMap: Record<STTProvider, string> = {
    groq: "GROQ_API_KEY",
    openai: "OPENAI_API_KEY",
  };
  const envKey = keyMap[provider];
  if (!process.env[envKey]) {
    throw new Error(`${envKey} is not configured on the server`);
  }
}
