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
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", tier: "powerful" },
    { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B", tier: "fast" },
    { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", tier: "balanced" },
    { id: "gemma2-9b-it", label: "Gemma 2 9B", tier: "fast" },
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
    { id: "distil-whisper-large-v3-en", label: "Distil Whisper v3", tier: "fast" },
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
