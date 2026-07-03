import type { AudioSource } from "@synvix/shared";
import { isElectron } from "./electron";
import { bufferToBase64 } from "./audio-utils";

export { bufferToBase64 };

export interface CaptureOptions {
  source: AudioSource;
  inputDeviceId?: string;
}

export async function captureAudio({ source, inputDeviceId }: CaptureOptions): Promise<MediaStream> {
  switch (source) {
    case "microphone":
      return captureMicrophone(inputDeviceId);
    case "system":
      return captureSystemAudio();
    case "both":
      return mixStreams(
        await captureMicrophone(inputDeviceId),
        await captureSystemAudio()
      );
    default:
      return captureMicrophone(inputDeviceId);
  }
}

async function captureMicrophone(deviceId?: string): Promise<MediaStream> {
  const audio: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
  };
  return navigator.mediaDevices.getUserMedia({ audio });
}

async function captureSystemAudio(): Promise<MediaStream> {
  if (isElectron()) {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { width: 1, height: 1, frameRate: 1 },
      audio: true,
    });
    stream.getVideoTracks().forEach((t) => {
      t.stop();
      stream.removeTrack(t);
    });
    if (stream.getAudioTracks().length === 0) {
      throw new Error("System audio unavailable. Check Windows loopback settings.");
    }
    return new MediaStream(stream.getAudioTracks());
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  stream.getVideoTracks().forEach((t) => {
    t.stop();
    stream.removeTrack(t);
  });
  if (stream.getAudioTracks().length === 0) {
    throw new Error("Enable 'Share audio' when selecting a tab.");
  }
  return stream;
}

function mixStreams(a: MediaStream, b: MediaStream): MediaStream {
  const ctx = new AudioContext();
  const dest = ctx.createMediaStreamDestination();
  if (a.getAudioTracks().length > 0) ctx.createMediaStreamSource(a).connect(dest);
  if (b.getAudioTracks().length > 0) ctx.createMediaStreamSource(b).connect(dest);
  const mixed = dest.stream;
  (mixed as MediaStream & { _sources?: MediaStream[]; _audioContext?: AudioContext })._sources = [a, b];
  (mixed as MediaStream & { _audioContext?: AudioContext })._audioContext = ctx;
  return mixed;
}

export function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
  const ext = stream as MediaStream & { _sources?: MediaStream[]; _audioContext?: AudioContext };
  ext._sources?.forEach((s) => s.getTracks().forEach((t) => t.stop()));
  ext._audioContext?.close();
}

export function getMimeType(): string {
  return MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
}

export const CHUNK_INTERVAL_MS = 2500;

export async function recordChunk(
  stream: MediaStream,
  mimeType: string,
  durationMs: number
): Promise<Blob | null> {
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, { mimeType });
  return new Promise((resolve) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => resolve(chunks.length > 0 ? new Blob(chunks, { type: mimeType }) : null);
    recorder.onerror = () => resolve(null);
    recorder.start();
    setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, durationMs);
  });
}

/** Set output device for an audio element (headphones/speakers) */
export async function setOutputDevice(
  element: HTMLAudioElement,
  deviceId: string
): Promise<void> {
  const sink = element as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
  if (sink.setSinkId) await sink.setSinkId(deviceId);
}
