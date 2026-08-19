import type { SessionConfig } from "@synvix/shared";
import { DEFAULT_SESSION_CONFIG, LLM_MODELS } from "@synvix/shared";

export function mergeConfig(partial?: Partial<SessionConfig>): SessionConfig {
  const merged = { ...DEFAULT_SESSION_CONFIG, ...partial };

  const validModels = LLM_MODELS[merged.llmProvider]?.map((m) => m.id) || [];
  if (!validModels.includes(merged.llmModel)) {
    merged.llmModel = validModels[0] || "";
  }

  return merged;
}

export function getProviderStatus() {
  return {
    gemini: !!process.env.GEMINI_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    claude: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
  };
}
