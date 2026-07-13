import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { registerProviderReset } from "../credentials";
import type { LLMProvider } from "@synvix/shared";

const OCR_PROMPT =
  "Extract ALL text from this image. Output ONLY the extracted text, nothing else. Preserve the original formatting and line breaks as much as possible. If there are code snippets, preserve them exactly. If there are multiple sections, separate them with blank lines.";

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

async function ocrWithGemini(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_OCR_MODEL || "gemini-2.0-flash",
  });

  const imagePart = { inlineData: { mimeType, data: base64Data } };
  const result = await model.generateContent([imagePart, { text: OCR_PROMPT }]);
  return result.response.text().trim();
}

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

async function ocrWithOpenAI(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: OCR_PROMPT },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64Data}` },
          },
        ],
      },
    ],
    max_tokens: 2000,
  });
  return (response.choices[0]?.message?.content || "").trim();
}

let claudeClient: Anthropic | null = null;

function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    claudeClient = new Anthropic({ apiKey });
  }
  return claudeClient;
}

async function ocrWithClaude(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const anthropic = getClaudeClient();
  const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
  const mediaType = (supportedTypes.includes(mimeType as typeof supportedTypes[number])
    ? mimeType
    : "image/png") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Data,
            },
          },
          { type: "text", text: OCR_PROMPT },
        ],
      },
    ],
  });
  const block = response.content[0];
  return block?.type === "text" ? block.text.trim() : "";
}

const VISION_PROVIDERS: Record<string, (base64: string, mime: string) => Promise<string>> = {
  gemini: ocrWithGemini,
  openai: ocrWithOpenAI,
  claude: ocrWithClaude,
};

const FALLBACK_ORDER: LLMProvider[] = ["gemini", "openai", "claude"];

registerProviderReset(() => {
  geminiClient = null;
  openaiClient = null;
  claudeClient = null;
});

export async function extractTextFromImage(
  imageBase64: string,
  mimeType: string = "image/png",
  preferredProvider?: LLMProvider
): Promise<string> {
  const base64Data = imageBase64.includes(",")
    ? imageBase64.split(",")[1]
    : imageBase64;

  const order = preferredProvider
    ? [preferredProvider, ...FALLBACK_ORDER.filter((p) => p !== preferredProvider)]
    : FALLBACK_ORDER;

  const errors: string[] = [];

  for (const provider of order) {
    const fn = VISION_PROVIDERS[provider];
    const keyName = provider === "claude" ? "ANTHROPIC_API_KEY" : `${provider.toUpperCase()}_API_KEY`;
    if (!process.env[keyName]) continue;

    try {
      return await fn(base64Data, mimeType);
    } catch (err) {
      errors.push(`${provider}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  throw new Error(
    `No vision-capable provider available. Set at least one of: GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY. Errors: ${errors.join("; ")}`
  );
}
