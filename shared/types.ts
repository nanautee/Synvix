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
  llmModel: string;
  sttProvider: STTProvider;
  sttModel: string;
  audioSource: AudioSource;
  position: string;
  techStack: string;
  language: string;
  llmBaseUrl: string;
  sttBaseUrl: string;
}

export type ClientMessage =
  | { type: "start_listening"; config?: Partial<SessionConfig> }
  | { type: "stop_listening" }
  | { type: "audio_chunk"; data: string; mimeType: string }
  | { type: "user_speech"; text: string }
  | { type: "text_input"; text: string }
  | { type: "flush_transcript" }
  | { type: "screenshot"; data: string; mimeType: string }
  | { type: "set_config"; config: Partial<SessionConfig> }
  | { type: "set_credentials"; credentials: Partial<Pick<UserConfig, "geminiApiKey" | "groqApiKey" | "anthropicApiKey" | "openaiApiKey">> };

export type ServerMessage =
  | { type: "transcript"; text: string; role: Role; isFinal: boolean }
  | { type: "transcript_pending"; fragments: string[] }
  | { type: "transcript_flushed"; text: string }
  | { type: "screenshot_result"; text: string }
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
  llmModel: string;
  sttProvider: STTProvider;
  sttModel: string;
  audioSource: AudioSource;
  audioInputId: string;
  audioOutputId: string;
  stealthMode: boolean;
  windowOpacity: number;
  position: string;
  techStack: string;
  language: string;
  llmBaseUrl: string;
  sttBaseUrl: string;
}

export const DEFAULT_USER_CONFIG: UserConfig = {
  geminiApiKey: "",
  groqApiKey: "",
  anthropicApiKey: "",
  openaiApiKey: "",
  llmProvider: "gemini",
  llmModel: "gemini-2.0-flash",
  sttProvider: "groq",
  sttModel: "whisper-large-v3-turbo",
  audioSource: "both",
  audioInputId: "",
  audioOutputId: "",
  stealthMode: true,
  windowOpacity: 0.88,
  position: "",
  techStack: "",
  language: "English",
  llmBaseUrl: "",
  sttBaseUrl: "",
};

export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  kind: "audioinput" | "audiooutput";
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  llmProvider: "gemini",
  llmModel: "gemini-2.0-flash",
  sttProvider: "groq",
  sttModel: "whisper-large-v3-turbo",
  audioSource: "both",
  position: "",
  techStack: "",
  language: "English",
  llmBaseUrl: "",
  sttBaseUrl: "",
};

export const LANGUAGES: string[] = [
  "English",
  "Russian",
  "Ukrainian",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Polish",
  "Turkish",
  "Arabic",
  "Hindi",
  "Chinese (Simplified)",
  "Japanese",
  "Korean",
  "Hebrew",
  "Indonesian",
  "Czech",
  "Swedish",
  "Danish",
  "Finnish",
  "Norwegian",
  "Greek",
  "Romanian",
  "Hungarian",
];

export const LANGUAGE_ISO: Record<string, string> = {
  English: "en",
  Russian: "ru",
  Ukrainian: "uk",
  Spanish: "es",
  French: "fr",
  German: "de",
  Italian: "it",
  Portuguese: "pt",
  Dutch: "nl",
  Polish: "pl",
  Turkish: "tr",
  Arabic: "ar",
  Hindi: "hi",
  "Chinese (Simplified)": "zh",
  Japanese: "ja",
  Korean: "ko",
  Hebrew: "he",
  Indonesian: "id",
  Czech: "cs",
  Swedish: "sv",
  Danish: "da",
  Finnish: "fi",
  Norwegian: "no",
  Greek: "el",
  Romanian: "ro",
  Hungarian: "hu",
};

export interface ModelInfo {
  id: string;
  label: string;
  tier?: "fast" | "balanced" | "powerful";
}

export const LLM_MODELS: Record<LLMProvider, ModelInfo[]> = {
  gemini: [
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", tier: "fast" },
    { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", tier: "fast" },
    { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", tier: "balanced" },
    { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", tier: "powerful" },
  ],
  groq: [
    { id: "openai/gpt-oss-120b", label: "GPT OSS 120B", tier: "powerful" },
    { id: "openai/gpt-oss-20b", label: "GPT OSS 20B", tier: "fast" },
    { id: "qwen/qwen3.6-27b", label: "Qwen 3.6 27B", tier: "balanced" },
  ],
  claude: [
    { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", tier: "powerful" },
    { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", tier: "fast" },
    { id: "claude-3-opus-20240229", label: "Claude 3 Opus", tier: "powerful" },
    { id: "claude-3-haiku-20240307", label: "Claude 3 Haiku", tier: "fast" },
  ],
  openai: [
    { id: "gpt-4o", label: "GPT-4o", tier: "powerful" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini", tier: "fast" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo", tier: "powerful" },
    { id: "o1-mini", label: "o1-mini", tier: "balanced" },
  ],
};

export const STT_MODELS: Record<STTProvider, ModelInfo[]> = {
  groq: [
    { id: "whisper-large-v3-turbo", label: "Whisper Large v3 Turbo", tier: "fast" },
    { id: "whisper-large-v3", label: "Whisper Large v3", tier: "powerful" },
  ],
  openai: [
    { id: "whisper-1", label: "Whisper v1", tier: "balanced" },
    { id: "gpt-4o-transcribe", label: "GPT-4o Transcribe", tier: "powerful" },
    { id: "gpt-4o-mini-transcribe", label: "GPT-4o Mini Transcribe", tier: "fast" },
  ],
};

export const LLM_PROVIDER_LABELS: Record<LLMProvider, string> = {
  gemini: "Google Gemini",
  groq: "Groq",
  claude: "Anthropic Claude",
  openai: "OpenAI",
};

export const TIER_LABELS: Record<string, string> = {
  fast: "Fast",
  balanced: "Balanced",
  powerful: "Powerful",
};
