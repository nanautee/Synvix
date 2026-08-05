import Groq from "groq-sdk";
import { toFile } from "openai/uploads";
import { LANGUAGE_ISO } from "@synvix/shared";
import { registerProviderReset } from "../credentials";

let groqClient: Groq | null = null;
let clientBaseUrl = "";

function getGroqClient(baseUrl?: string): Groq {
  const normalized = baseUrl?.trim() || "";
  if (!groqClient || normalized !== clientBaseUrl) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");
    groqClient = new Groq({ apiKey, ...(normalized ? { baseURL: normalized } : {}) });
    clientBaseUrl = normalized;
  }
  return groqClient;
}

registerProviderReset(() => {
  groqClient = null;
  clientBaseUrl = "";
});

function mimeToExtension(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

export async function transcribeWithGroq(
  buffer: Buffer,
  mimeType: string,
  model?: string,
  language?: string,
  baseUrl?: string
): Promise<string> {
  const groq = getGroqClient(baseUrl);
  const ext = mimeToExtension(mimeType);
  const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });

  const iso = language ? LANGUAGE_ISO[language] : undefined;
  const response = await groq.audio.transcriptions.create({
    file,
    model: model || process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo",
    prompt:
      "Technical interview: programming, system design, algorithms, data structures, software architecture, cloud, databases, APIs, frameworks, DevOps, behavioral questions.",
    response_format: "text",
    ...(iso ? { language: iso } : {}),
  });

  return typeof response === "string" ? response : String(response);
}
