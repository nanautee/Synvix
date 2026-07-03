import OpenAI from "openai";
import { toFile } from "openai/uploads";
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

function mimeToExtension(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const openai = getClient();
  const ext = mimeToExtension(mimeType);

  const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });

  const response = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "en",
    prompt: "Technical interview conversation. The interviewer asks questions about programming, experience, and projects.",
  });

  return response.text;
}
