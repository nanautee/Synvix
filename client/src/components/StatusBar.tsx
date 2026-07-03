import type { LLMProvider } from "@synvix/shared";
import { LLM_PROVIDER_LABELS } from "@synvix/shared";

interface Props {
  connected: boolean;
  listening: boolean;
  isGenerating: boolean;
  provider: LLMProvider | null;
}

export function StatusBar({ connected, listening, isGenerating, provider }: Props) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            connected ? "bg-emerald-400" : "bg-red-500 animate-pulse"
          }`}
        />
        <span className="text-gray-500">{connected ? "Live" : "Offline"}</span>
      </div>

      {listening && (
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-gray-500">Recording</span>
        </div>
      )}

      {isGenerating && provider && (
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-gray-500">{LLM_PROVIDER_LABELS[provider]}</span>
        </div>
      )}
    </div>
  );
}
