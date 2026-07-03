import type { TranscriptMessage, ContextConfig } from "@synvix/shared";

const DEFAULT_CONFIG: ContextConfig = {
  maxMessages: 20,
  maxAgeMs: 60_000,
};

export class ContextBuilder {
  private messages: TranscriptMessage[] = [];
  private config: ContextConfig;

  constructor(config: Partial<ContextConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  addMessage(role: TranscriptMessage["role"], text: string): void {
    this.messages.push({
      role,
      text,
      timestamp: Date.now(),
    });
    this.prune();
  }

  getMessages(): TranscriptMessage[] {
    this.prune();
    return [...this.messages];
  }

  getContextString(): string {
    return this.getMessages()
      .map((m) => `${m.role === "interviewer" ? "Interviewer" : "Candidate"}: ${m.text}`)
      .join("\n");
  }

  clear(): void {
    this.messages = [];
  }

  private prune(): void {
    const cutoff = Date.now() - this.config.maxAgeMs;
    this.messages = this.messages
      .filter((m) => m.timestamp >= cutoff)
      .slice(-this.config.maxMessages);
  }
}
