import { describe, it, expect, beforeAll, afterAll } from "vitest";
import WebSocket from "ws";
import { createApp, type AppInstance } from "../app";

function waitForMessage(ws: WebSocket, timeoutMs = 3000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    ws.once("message", (data) => {
      clearTimeout(timer);
      resolve(data.toString());
    });
    ws.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function connectWs(port: number): Promise<WebSocket> {
  const ws = new WebSocket(`ws://localhost:${port}/ws`);

  await new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onMessage = () => {
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      ws.off("open", onOpen);
      ws.off("message", onMessage);
      ws.off("error", onError);
    };
    ws.once("open", onOpen);
    ws.once("message", onMessage);
    ws.once("error", onError);
  });

  return ws;
}

describe("WebSocket integration", () => {
  let app: AppInstance;
  let port: number;

  beforeAll(async () => {
    app = createApp(0);
    await new Promise<void>((resolve) => app.server.once("listening", resolve));
    const addr = app.server.address();
    port = typeof addr === "object" && addr ? addr.port : 3001;
  });

  afterAll(async () => {
    await app.close();
  });

  it("connects and receives initial status", async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    const message = await new Promise<string>((resolve, reject) => {
      ws.once("open", () => {});
      ws.once("message", (data) => resolve(data.toString()));
      ws.once("error", reject);
    });

    const parsed = JSON.parse(message);
    expect(parsed.type).toBe("status");
    expect(parsed.listening).toBe(false);
    expect(parsed.config.llmProvider).toBe("gemini");

    ws.close();
    await new Promise<void>((resolve) => ws.once("close", resolve));
  });

  it("handles set_credentials message", async () => {
    const ws = await connectWs(port);
    ws.send(
      JSON.stringify({
        type: "set_credentials",
        credentials: { groqApiKey: "test-groq-key" },
      })
    );

    const message = await waitForMessage(ws);
    const parsed = JSON.parse(message);
    expect(parsed.type).toBe("status");
    expect(process.env.GROQ_API_KEY).toBe("test-groq-key");

    ws.close();
    await new Promise<void>((resolve) => ws.once("close", resolve));
  });

  it("handles set_config message", async () => {
    const ws = await connectWs(port);
    ws.send(JSON.stringify({ type: "set_config", config: { llmProvider: "claude" } }));

    const message = await waitForMessage(ws);
    const parsed = JSON.parse(message);
    expect(parsed.type).toBe("status");
    expect(parsed.config.llmProvider).toBe("claude");

    ws.close();
    await new Promise<void>((resolve) => ws.once("close", resolve));
  });

  it("handles start/stop listening", async () => {
    const ws = await connectWs(port);

    ws.send(JSON.stringify({ type: "start_listening" }));
    const startMsg = JSON.parse(await waitForMessage(ws));
    expect(startMsg.listening).toBe(true);

    ws.send(JSON.stringify({ type: "stop_listening" }));
    const stopMsg = JSON.parse(await waitForMessage(ws));
    expect(stopMsg.listening).toBe(false);

    ws.close();
    await new Promise<void>((resolve) => ws.once("close", resolve));
  });

  it("returns error for invalid JSON", async () => {
    const ws = await connectWs(port);
    ws.send("not-json");

    const message = await waitForMessage(ws);
    const parsed = JSON.parse(message);
    expect(parsed.type).toBe("error");

    ws.close();
    await new Promise<void>((resolve) => ws.once("close", resolve));
  });

  it("health endpoint returns ok", async () => {
    const res = await fetch(`http://localhost:${port}/health`);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.providers).toBeDefined();
  });
});
