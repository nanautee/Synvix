import type { UserConfig } from "@synvix/shared";
import {
  LLM_PROVIDER_LABELS,
  LLM_MODELS,
  STT_MODELS,
  TIER_LABELS,
  type LLMProvider,
  type STTProvider,
  type AudioSource,
} from "@synvix/shared";
import type { AudioDeviceInfo } from "@synvix/shared";
import { useAudioDevices } from "../hooks/useAudioDevices";

interface Props {
  config: UserConfig;
  onChange: (partial: Partial<UserConfig>) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

export function SettingsPanel({ config, onChange, onSave, saving, saved }: Props) {
  const { inputs, outputs, refresh } = useAudioDevices();

  const llmModels = LLM_MODELS[config.llmProvider] || [];
  const sttModels = STT_MODELS[config.sttProvider] || [];

  const handleProviderChange = (provider: LLMProvider) => {
    const models = LLM_MODELS[provider];
    onChange({
      llmProvider: provider,
      llmModel: models[0]?.id || "",
    });
  };

  const handleSTTProviderChange = (provider: STTProvider) => {
    const models = STT_MODELS[provider];
    onChange({
      sttProvider: provider,
      sttModel: models[0]?.id || "",
    });
  };

  return (
    <section className="no-drag glass-panel rounded-xl p-3 space-y-3 text-white/80">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Settings</h2>
        {saved && <span className="text-[9px] text-white/50">Saved locally</span>}
      </div>

      {/* API Keys */}
      <div className="space-y-2">
        <p className="text-[9px] text-white/35 uppercase tracking-wider">API Keys — stored on your device only</p>
        <ApiKeyField label="Gemini" value={config.geminiApiKey} onChange={(v) => onChange({ geminiApiKey: v })} />
        <ApiKeyField label="Groq" value={config.groqApiKey} onChange={(v) => onChange({ groqApiKey: v })} />
        <ApiKeyField label="Claude" value={config.anthropicApiKey} onChange={(v) => onChange({ anthropicApiKey: v })} />
        <ApiKeyField label="OpenAI" value={config.openaiApiKey} onChange={(v) => onChange({ openaiApiKey: v })} />
      </div>

      {/* LLM Provider + Model */}
      <div className="space-y-2">
        <p className="text-[9px] text-white/35 uppercase tracking-wider">LLM — Answer Generation</p>
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Provider" value={config.llmProvider} onChange={(v) => handleProviderChange(v as LLMProvider)}>
            {(Object.keys(LLM_PROVIDER_LABELS) as LLMProvider[]).map((p) => (
              <option key={p} value={p}>{LLM_PROVIDER_LABELS[p]}</option>
            ))}
          </SelectField>
          <SelectField label="Model" value={config.llmModel} onChange={(v) => onChange({ llmModel: v })}>
            {llmModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}{m.tier ? ` (${TIER_LABELS[m.tier]})` : ""}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {/* STT Provider + Model */}
      <div className="space-y-2">
        <p className="text-[9px] text-white/35 uppercase tracking-wider">STT — Speech to Text</p>
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Provider" value={config.sttProvider} onChange={(v) => handleSTTProviderChange(v as STTProvider)}>
            <option value="groq">Groq</option>
            <option value="openai">OpenAI</option>
          </SelectField>
          <SelectField label="Model" value={config.sttModel} onChange={(v) => onChange({ sttModel: v })}>
            {sttModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}{m.tier ? ` (${TIER_LABELS[m.tier]})` : ""}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {/* Interview Context */}
      <div className="space-y-2">
        <p className="text-[9px] text-white/35 uppercase tracking-wider">Interview Context</p>
        <div className="space-y-1.5">
          <label className="space-y-0.5 block">
            <span className="text-[9px] text-white/40">Position / Role</span>
            <input
              type="text"
              value={config.position}
              onChange={(e) => onChange({ position: e.target.value })}
              placeholder="e.g. Senior Frontend Developer"
              className="synvix-input w-full text-[10px]"
            />
          </label>
          <label className="space-y-0.5 block">
            <span className="text-[9px] text-white/40">Tech Stack</span>
            <input
              type="text"
              value={config.techStack}
              onChange={(e) => onChange({ techStack: e.target.value })}
              placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
              className="synvix-input w-full text-[10px]"
            />
          </label>
        </div>
      </div>

      {/* Audio devices */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[9px] text-white/35 uppercase tracking-wider">Audio Devices</p>
          <button onClick={refresh} className="text-[9px] text-white/40 hover:text-white/70 underline">
            Refresh
          </button>
        </div>
        <DeviceSelect
          label="Microphone"
          devices={inputs}
          value={config.audioInputId}
          onChange={(id) => onChange({ audioInputId: id })}
        />
        <DeviceSelect
          label="Headphones / Output"
          devices={outputs}
          value={config.audioOutputId}
          onChange={(id) => onChange({ audioOutputId: id })}
        />
        <SelectField label="Source" value={config.audioSource} onChange={(v) => onChange({ audioSource: v as AudioSource })}>
          <option value="both">Mic + System</option>
          <option value="system">System only</option>
          <option value="microphone">Mic only</option>
        </SelectField>
      </div>

      {/* Appearance */}
      <div className="space-y-2">
        <label className="text-[9px] text-white/35 uppercase tracking-wider block">
          Opacity — {Math.round(config.windowOpacity * 100)}%
        </label>
        <input
          type="range"
          min={55}
          max={100}
          value={Math.round(config.windowOpacity * 100)}
          onChange={(e) => onChange({ windowOpacity: Number(e.target.value) / 100 })}
          className="w-full h-1 accent-white"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={config.stealthMode}
          onChange={(e) => onChange({ stealthMode: e.target.checked })}
          className="w-3 h-3 rounded accent-white"
        />
        <span className="text-[10px] text-white/60">Stealth — hidden in screen share</span>
      </label>

      <button
        onClick={onSave}
        disabled={saving}
        className="synvix-btn w-full py-1.5 text-[10px] font-medium disabled:opacity-40"
      >
        {saving ? "Saving…" : "Save & Connect"}
      </button>
    </section>
  );
}

function ApiKeyField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-white/40 w-12 shrink-0">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="sk-…"
        className="synvix-input flex-1 text-[10px]"
        autoComplete="off"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-0.5 block">
      <span className="text-[9px] text-white/40">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="synvix-select w-full text-[10px]">
        {children}
      </select>
    </label>
  );
}

function DeviceSelect({
  label,
  devices,
  value,
  onChange,
}: {
  label: string;
  devices: AudioDeviceInfo[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="space-y-0.5 block">
      <span className="text-[9px] text-white/40">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="synvix-select w-full text-[10px]">
        <option value="">Default</option>
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
        ))}
      </select>
    </label>
  );
}
