import type { UserConfig } from "@synvix/shared";

export type ApiCredentials = Pick<
  UserConfig,
  "geminiApiKey" | "groqApiKey" | "anthropicApiKey" | "openaiApiKey"
>;

const ENV_KEYS: Record<keyof ApiCredentials, string> = {
  geminiApiKey: "GEMINI_API_KEY",
  groqApiKey: "GROQ_API_KEY",
  anthropicApiKey: "ANTHROPIC_API_KEY",
  openaiApiKey: "OPENAI_API_KEY",
};

const resets: Array<() => void> = [];

export function registerProviderReset(reset: () => void): void {
  resets.push(reset);
}

function resetProviders(): void {
  for (const reset of resets) reset();
}

export function applyCredentials(credentials: Partial<ApiCredentials>): void {
  for (const [field, envKey] of Object.entries(ENV_KEYS) as [keyof ApiCredentials, string][]) {
    if (!(field in credentials)) continue;
    const value = credentials[field]?.trim();
    if (value) process.env[envKey] = value;
    else delete process.env[envKey];
  }
  resetProviders();
}
