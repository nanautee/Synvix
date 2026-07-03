export type Role = "interviewer" | "user";

export type LLMProvider = "gemini" | "groq" | "claude" | "openai";
export type STTProvider = "groq" | "openai";
export type AudioSource = "microphone" | "system" | "both";

export interface TranscriptMessage {
  role: Role;
  text: string;
  timestamp: number;
}

export interface AIAnswer {
  short: string;
  expanded: string;
  bullets: string[];
}

export interface SessionConfig {
  llmProvider: LLMProvider;
  sttProvider: STTProvider;
  audioSource: AudioSource;
}

export type ClientMessage =
  | { type: "start_listening"; config?: Partial<SessionConfig> }
  | { type: "stop_listening" }
  | { type: "audio_chunk"; data: string; mimeType: string }
  | { type: "user_speech"; text: string }
  | { type: "set_config"; config: Partial<SessionConfig> }
  | { type: "set_credentials"; credentials: Partial<Pick<UserConfig, "geminiApiKey" | "groqApiKey" | "anthropicApiKey" | "openaiApiKey">> };

export type ServerMessage =
  | { type: "transcript"; text: string; role: Role; isFinal: boolean }
  | { type: "answer_start"; provider: LLMProvider }
  | { type: "answer_token"; token: string }
  | { type: "answer_complete"; answer: AIAnswer }
  | { type: "error"; message: string }
  | { type: "status"; listening: boolean; config?: SessionConfig };

export interface ContextConfig {
  maxMessages: number;
  maxAgeMs: number;
}

export interface UserConfig {
  geminiApiKey: string;
  groqApiKey: string;
  anthropicApiKey: string;
  openaiApiKey: string;
  llmProvider: LLMProvider;
  sttProvider: STTProvider;
  audioSource: AudioSource;
  audioInputId: string;
  audioOutputId: string;
  stealthMode: boolean;
  windowOpacity: number;
}

export const DEFAULT_USER_CONFIG: UserConfig = {
  geminiApiKey: "",
  groqApiKey: "",
  anthropicApiKey: "",
  openaiApiKey: "",
  llmProvider: "gemini",
  sttProvider: "groq",
  audioSource: "both",
  audioInputId: "",
  audioOutputId: "",
  stealthMode: true,
  windowOpacity: 0.88,
};

export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  kind: "audioinput" | "audiooutput";
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  llmProvider: "gemini",
  sttProvider: "groq",
  audioSource: "both",
};

export const LLM_PROVIDER_LABELS: Record<LLMProvider, string> = {
  gemini: "Gemini Flash",
  groq: "Groq Llama",
  claude: "Claude Haiku",
  openai: "GPT-4o mini",
};
