import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { LANGUAGE_ISO } from "@synvix/shared";
import { registerProviderReset } from "../credentials";

let client: OpenAI | null = null;
let clientBaseUrl = "";

function getClient(baseUrl?: string): OpenAI {
  const normalized = baseUrl?.trim() || "";
  if (!client || normalized !== clientBaseUrl) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    client = new OpenAI({ apiKey, ...(normalized ? { baseURL: normalized } : {}) });
    clientBaseUrl = normalized;
  }
  return client;
}

registerProviderReset(() => {
  client = null;
  clientBaseUrl = "";
});

function mimeToExtension(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
  model?: string,
  language?: string,
  baseUrl?: string
): Promise<string> {
  const openai = getClient(baseUrl);
  const ext = mimeToExtension(mimeType);

  const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });

  const iso = language ? LANGUAGE_ISO[language] : undefined;
  const response = await openai.audio.transcriptions.create({
    model: model || "whisper-1",
    file,
    prompt: "Technical interview: programming, system design, algorithms, data structures, software architecture, cloud, databases, APIs, frameworks, DevOps, behavioral questions.",
    ...(iso ? { language: iso } : {}),
  });

  return response.text;
}
