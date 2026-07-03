import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AIAnswer,
  ClientMessage,
  ServerMessage,
  TranscriptMessage,
  SessionConfig,
  LLMProvider,
  UserConfig,
} from "@synvix/shared";
import { DEFAULT_USER_CONFIG } from "@synvix/shared";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { AnswerPanel } from "./components/AnswerPanel";
import { ControlBar } from "./components/ControlBar";
import { SettingsPanel } from "./components/SettingsPanel";
import { TitleBar } from "./components/TitleBar";
import { isElectron, getElectronAPI } from "./lib/electron";
import {
  captureAudio,
  stopStream,
  getMimeType,
  bufferToBase64,
  CHUNK_INTERVAL_MS,
  recordChunk,
} from "./lib/audio";

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (isElectron()
    ? "ws://localhost:3001/ws"
    : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`);

function userConfigToSession(c: UserConfig): SessionConfig {
  return {
    llmProvider: c.llmProvider,
    sttProvider: c.sttProvider,
    audioSource: c.audioSource,
  };
}

function userConfigToCredentials(c: UserConfig) {
  return {
    geminiApiKey: c.geminiApiKey,
    groqApiKey: c.groqApiKey,
    anthropicApiKey: c.anthropicApiKey,
    openaiApiKey: c.openaiApiKey,
  };
}

export default function App() {
  const [connected, setConnected] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [answer, setAnswer] = useState<AIAnswer | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<LLMProvider | null>(null);
  const [userConfig, setUserConfig] = useState<UserConfig>(DEFAULT_USER_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [configReady, setConfigReady] = useState(!isElectron());

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const configRef = useRef(userConfig);
  const activeRef = useRef(false);
  const inElectron = isElectron();

  configRef.current = userConfig;

  const send = useCallback((message: ClientMessage) => {
    wsRef.current?.readyState === WebSocket.OPEN &&
      wsRef.current.send(JSON.stringify(message));
  }, []);

  const sendSessionConfig = useCallback((config: UserConfig) => {
    send({ type: "set_credentials", credentials: userConfigToCredentials(config) });
    send({ type: "set_config", config: userConfigToSession(config) });
  }, [send]);

  // Load local config before connecting to the server
  useEffect(() => {
    if (!inElectron) return;
    getElectronAPI()?.loadConfig().then((c) => {
      const config = { ...DEFAULT_USER_CONFIG, ...c } as UserConfig;
      setUserConfig(config);
      configRef.current = config;
      getElectronAPI()?.setOpacity(config.windowOpacity);
      getElectronAPI()?.setContentProtection(config.stealthMode);
      setConfigReady(true);
    });
  }, [inElectron]);

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
      sendSessionConfig(configRef.current);
    };

    ws.onclose = () => {
      setConnected(false);
      setListening(false);
      setTimeout(connect, 2000);
    };

    ws.onerror = () => setError("Connection failed — check API keys in Settings");

    ws.onmessage = (event) => {
      const message: ServerMessage = JSON.parse(event.data);
      switch (message.type) {
        case "status":
          setListening(message.listening);
          break;
        case "transcript":
          setTranscripts((p) => [...p, { role: message.role, text: message.text, timestamp: Date.now() }]);
          break;
        case "answer_start":
          setIsGenerating(true);
          setStreamingAnswer("");
          setAnswer(null);
          setActiveProvider(message.provider);
          break;
        case "answer_token":
          setStreamingAnswer((p) => p + message.token);
          break;
        case "answer_complete":
          setIsGenerating(false);
          setAnswer(message.answer);
          setStreamingAnswer("");
          break;
        case "error":
          setError(message.message);
          setIsGenerating(false);
          break;
      }
    };
  }, [send, sendSessionConfig]);

  useEffect(() => {
    if (!configReady) return;
    connect();
    return () => {
      activeRef.current = false;
      wsRef.current?.close();
      stopStream(streamRef.current);
    };
  }, [configReady, connect]);

  const handleConfigChange = (partial: Partial<UserConfig>) => {
    setUserConfig((c) => {
      const next = { ...c, ...partial };
      if (partial.windowOpacity !== undefined) {
        getElectronAPI()?.setOpacity(partial.windowOpacity);
      }
      if (partial.stealthMode !== undefined) {
        getElectronAPI()?.setContentProtection(partial.stealthMode);
      }
      return next;
    });
    setSaved(false);
  };

  const handleSaveConfig = async () => {
    if (!inElectron) return;
    setSaving(true);
    try {
      await getElectronAPI()?.saveConfig(userConfig);
      sendSessionConfig(userConfig);
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  const recordLoop = async (mimeType: string) => {
    while (activeRef.current && streamRef.current) {
      const blob = await recordChunk(streamRef.current, mimeType, CHUNK_INTERVAL_MS);
      if (!activeRef.current || !blob) continue;
      send({ type: "audio_chunk", data: bufferToBase64(await blob.arrayBuffer()), mimeType });
    }
  };

  const startListening = async () => {
    try {
      const stream = await captureAudio({
        source: userConfig.audioSource,
        inputDeviceId: userConfig.audioInputId || undefined,
      });
      streamRef.current = stream;
      activeRef.current = true;
      sendSessionConfig(userConfig);
      send({ type: "start_listening", config: userConfigToSession(userConfig) });
      setError(null);
      recordLoop(getMimeType());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audio capture failed");
    }
  };

  const stopListening = () => {
    activeRef.current = false;
    send({ type: "stop_listening" });
    stopStream(streamRef.current);
    streamRef.current = null;
    setListening(false);
  };

  if (!inElectron) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white/60 text-sm p-8 text-center">
        Synvix desktop app — open via Electron or download from synvix.com
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col glass-surface overflow-hidden rounded-none">
      <TitleBar
        connected={connected}
        listening={listening}
        isGenerating={isGenerating}
        stealthMode={userConfig.stealthMode}
        provider={activeProvider}
      />

      <main className="flex-1 flex flex-col gap-2 px-2.5 py-2 min-h-0 overflow-hidden">
        {error && (
          <div className="shrink-0 glass-panel rounded-md px-2 py-1 text-[9px] text-white/60 border-white/10">
            {error}
          </div>
        )}

        {showSettings && (
          <div className="shrink-0 overflow-y-auto max-h-56">
            <SettingsPanel
              config={userConfig}
              onChange={handleConfigChange}
              onSave={handleSaveConfig}
              saving={saving}
              saved={saved}
            />
          </div>
        )}

        <TranscriptPanel messages={transcripts} />
        <AnswerPanel answer={answer} streaming={streamingAnswer} isGenerating={isGenerating} />
      </main>

      <footer className="shrink-0 border-t border-white/8 px-2.5 py-2">
        <ControlBar
          listening={listening}
          connected={connected}
          onToggle={() => (listening ? stopListening() : startListening())}
          onClear={() => { setTranscripts([]); setAnswer(null); setStreamingAnswer(""); setError(null); }}
          onToggleSettings={() => setShowSettings((s) => !s)}
          settingsOpen={showSettings}
        />
      </footer>
    </div>
  );
}
