export interface TranscriptBufferConfig {
  silenceTimeoutMs: number;
  maxBufferSize: number;
  minTextLength: number;
}

const DEFAULT_CONFIG: TranscriptBufferConfig = {
  silenceTimeoutMs: 3000,
  maxBufferSize: 10,
  minTextLength: 3,
};

export type TranscriptBufferEvent =
  | { type: "fragment_added"; fragments: string[] }
  | { type: "flushed"; text: string };

export class TranscriptBuffer {
  private fragments: string[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private config: TranscriptBufferConfig;
  private onEvent: (event: TranscriptBufferEvent) => void;

  constructor(
    onEvent: (event: TranscriptBufferEvent) => void,
    config: Partial<TranscriptBufferConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.onEvent = onEvent;
  }

  add(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < this.config.minTextLength) return;

    this.fragments.push(trimmed);
    this.onEvent({ type: "fragment_added", fragments: [...this.fragments] });

    if (this.fragments.length >= this.config.maxBufferSize) {
      this.flush();
      return;
    }

    this.resetTimer();
  }

  flush(): void {
    this.clearTimer();
    const combined = this.fragments.join(" ");
    this.fragments = [];
    if (combined.trim()) {
      this.onEvent({ type: "flushed", text: combined.trim() });
    }
  }

  clear(): void {
    this.clearTimer();
    this.fragments = [];
  }

  get pending(): boolean {
    return this.fragments.length > 0;
  }

  get fragmentCount(): number {
    return this.fragments.length;
  }

  private resetTimer(): void {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.flush();
    }, this.config.silenceTimeoutMs);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
