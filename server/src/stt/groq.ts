import Groq from "groq-sdk";
import { toFile } from "openai/uploads";
import { registerProviderReset } from "../credentials";

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

registerProviderReset(() => {
  groqClient = null;
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
  mimeType: string
): Promise<string> {
  const groq = getGroqClient();
  const ext = mimeToExtension(mimeType);
  const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });

  const response = await groq.audio.transcriptions.create({
    file,
    model: process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo",
    language: "en",
    prompt:
      "Technical interview. The interviewer asks questions about programming, experience, and projects.",
    response_format: "text",
  });

  return typeof response === "string" ? response : String(response);
}
