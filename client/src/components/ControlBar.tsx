interface Props {
  listening: boolean;
  connected: boolean;
  onToggle: () => void;
  onClear: () => void;
  onToggleSettings: () => void;
  settingsOpen: boolean;
}

export function ControlBar({
  listening,
  connected,
  onToggle,
  onClear,
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
