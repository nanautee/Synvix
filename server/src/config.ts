import type { SessionConfig } from "@synvix/shared";
import { DEFAULT_SESSION_CONFIG } from "@synvix/shared";

export function mergeConfig(partial?: Partial<SessionConfig>): SessionConfig {
  return { ...DEFAULT_SESSION_CONFIG, ...partial };
}

export function getProviderStatus() {
  return {
    gemini: !!process.env.GEMINI_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    claude: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
  };
}
