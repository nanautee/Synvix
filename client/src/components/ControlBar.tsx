interface Props {
  listening: boolean;
  connected: boolean;
  electronAvailable: boolean;
  onToggle: () => void;
  onClear: () => void;
  onFlush: () => void;
  onScreenshot: () => void;
  onToggleSettings: () => void;
  settingsOpen: boolean;
}

export function ControlBar({
  listening,
  connected,
  electronAvailable,
  onToggle,
  onClear,
  onFlush,
  onScreenshot,
  onToggleSettings,
  settingsOpen,
}: Props) {
  return (
    <div className="no-drag flex items-center justify-center gap-1.5">
      <button
        onClick={onToggle}
        disabled={!connected}
        className={`synvix-btn px-3 py-1 rounded-md text-[10px] font-medium disabled:opacity-30 ${
          listening ? "synvix-btn-danger" : "synvix-btn-active"
        }`}
      >
        {listening ? "Stop" : "Start"}
      </button>

      {listening && (
        <button
          onClick={onFlush}
          className="synvix-btn px-2 py-1 rounded-md text-[10px] font-medium synvix-btn-active"
          title="Send question now"
        >
          ▶ Send
        </button>
      )}

      <button
        onClick={onScreenshot}
        disabled={!connected || !electronAvailable}
        className="synvix-btn w-7 h-7 rounded-md text-[10px] text-white/50 disabled:opacity-30"
        title={electronAvailable ? "Capture screenshot & extract text" : "Desktop app only"}
      >
        📷
      </button>

      <button
        onClick={onClear}
        className="synvix-btn w-7 h-7 rounded-md text-[10px] text-white/50"
        title="Clear"
      >
        ⌫
      </button>

      <button
        onClick={onToggleSettings}
        className={`synvix-btn w-7 h-7 rounded-md text-[10px] ${
          settingsOpen ? "synvix-btn-active !text-black" : "text-white/50"
        }`}
        title="Settings"
      >
        ⚙
      </button>
    </div>
  );
}
