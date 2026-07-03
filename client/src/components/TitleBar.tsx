import type { CSSProperties } from "react";
import type { LLMProvider } from "@synvix/shared";
import { getElectronAPI } from "../lib/electron";

interface Props {
  connected: boolean;
  listening: boolean;
  isGenerating: boolean;
  stealthMode: boolean;
  provider: LLMProvider | null;
}

export function TitleBar({ connected, listening, isGenerating, stealthMode, provider }: Props) {
  const api = getElectronAPI();
  if (!api) return null;

  return (
    <div
      className="drag-region flex items-center justify-between px-2.5 py-1.5 border-b border-white/10 shrink-0"
      style={{ WebkitAppRegion: "drag" } as CSSProperties}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-5 h-5 rounded-md bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
          <span className="text-[8px] font-bold text-white/70 tracking-tighter">SX</span>
        </div>
        <span className="text-[11px] font-medium text-white/80 tracking-wide">Synvix</span>
        {stealthMode && (
          <span className="text-[8px] px-1 py-px rounded-full bg-white/10 text-white/50 border border-white/10">
            stealth
          </span>
        )}
      </div>

      <div className="no-drag flex items-center gap-1.5" style={{ WebkitAppRegion: "no-drag" } as CSSProperties}>
        <Dot on={connected} title="Connected" />
        <Dot on={listening} pulse title="Recording" />
        <Dot on={isGenerating} pulse title={provider ?? "AI"} />
      </div>

      <div className="no-drag flex" style={{ WebkitAppRegion: "no-drag" } as CSSProperties}>
        <WinBtn onClick={() => api.minimize()} label="─" />
        <WinBtn onClick={() => api.close()} label="✕" danger />
      </div>
    </div>
  );
}

function Dot({ on, pulse, title }: { on: boolean; pulse?: boolean; title: string }) {
  return (
    <span
      title={title}
      className={`w-1.5 h-1.5 rounded-full ${on ? `bg-white ${pulse ? "animate-pulse" : ""}` : "bg-white/20"}`}
    />
  );
}

function WinBtn({ onClick, label, danger }: { onClick: () => void; label: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-5 h-5 rounded text-[10px] flex items-center justify-center transition-colors ${
        danger ? "hover:bg-white/20 text-white/40 hover:text-white/80" : "hover:bg-white/10 text-white/40 hover:text-white/70"
      }`}
    >
      {label}
    </button>
  );
}
