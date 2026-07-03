import { useCallback, useEffect, useState } from "react";
import type { AudioDeviceInfo } from "@synvix/shared";

export function useAudioDevices() {
  const [inputs, setInputs] = useState<AudioDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<AudioDeviceInfo[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      // Request permission so labels are available
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      // Labels may be empty without permission
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    setInputs(
      devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 6)}`,
          kind: "audioinput" as const,
        }))
    );
    setOutputs(
      devices
        .filter((d) => d.kind === "audiooutput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${d.deviceId.slice(0, 6)}`,
          kind: "audiooutput" as const,
        }))
    );
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    navigator.mediaDevices.addEventListener("devicechange", refresh);
    return () => navigator.mediaDevices.removeEventListener("devicechange", refresh);
  }, [refresh]);

  return { inputs, outputs, ready, refresh };
}
