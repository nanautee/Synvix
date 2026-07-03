interface Props {
  enabled: boolean;
  isElectron: boolean;
}

export function StealthIndicator({ enabled, isElectron }: Props) {
  if (!isElectron) return null;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
        enabled
          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
          : "bg-yellow-950/60 text-yellow-400 border border-yellow-800/50"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${enabled ? "bg-emerald-400" : "bg-yellow-400"}`} />
      {enabled ? "Invisible in screen share" : "Visible in screen share"}
    </div>
  );
}
