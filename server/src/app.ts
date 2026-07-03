import express from "express";
import cors from "cors";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import type { ClientMessage, ServerMessage, SessionConfig } from "@synvix/shared";
import { ContextBuilder } from "./context/context-builder";
import { transcribe, validateSTTProvider } from "./stt/provider";
import { streamAnswer, validateLLMProvider } from "./llm/provider";
import { parseAnswer } from "./answer-parser";
import { mergeConfig, getProviderStatus } from "./config";
import { applyCredentials } from "./credentials";

export interface AppInstance {
  server: Server;
  port: number;
  close: () => Promise<void>;
}

export function createApp(port = Number(process.env.PORT) || 3001): AppInstance {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: Date.now(),
      providers: getProviderStatus(),
    });
  });

  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });

  function send(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  wss.on("connection", (ws) => {
    const context = new ContextBuilder();
    let config = mergeConfig();
    let isListening = false;
    let isProcessing = false;
    let lastTranscript = "";

    send(ws, { type: "status", listening: false, config });

    ws.on("message", async (raw) => {
      let message: ClientMessage;
      try {
        message = JSON.parse(raw.toString()) as ClientMessage;
      } catch {
        send(ws, { type: "error", message: "Invalid message format" });
        return;
      }

      switch (message.type) {
        case "set_config":
          config = mergeConfig({ ...config, ...message.config });
          send(ws, { type: "status", listening: isListening, config });
          break;

        case "set_credentials":
          applyCredentials(message.credentials);
          send(ws, { type: "status", listening: isListening, config });
          break;

        case "start_listening":
          if (message.config) config = mergeConfig({ ...config, ...message.config });
          isListening = true;
          lastTranscript = "";
          send(ws, { type: "status", listening: true, config });
          break;

        case "stop_listening":
          isListening = false;
          send(ws, { type: "status", listening: false, config });
          break;

        case "user_speech":
          if (!message.text.trim()) return;
          context.addMessage("user", message.text.trim());
          send(ws, {
            type: "transcript",
            text: message.text.trim(),
            role: "user",
            isFinal: true,
          });
          break;

        case "audio_chunk": {
          if (!isListening || isProcessing) return;

          isProcessing = true;
          try {
            validateSTTProvider(config.sttProvider);
            validateLLMProvider(config.llmProvider);

            const buffer = Buffer.from(message.data, "base64");
            const text = await transcribe(config.sttProvider, buffer, message.mimeType);

            if (text && text.trim() && text.trim() !== lastTranscript) {
              lastTranscript = text.trim();
              context.addMessage("interviewer", text.trim());

              send(ws, {
                type: "transcript",
                text: text.trim(),
                role: "interviewer",
                isFinal: true,
              });

              await generateAndStreamAnswer(ws, context, text.trim(), config);
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Processing failed";
            send(ws, { type: "error", message: msg });
          } finally {
            isProcessing = false;
          }
          break;
        }
      }
    });

    ws.on("close", () => {
      isListening = false;
    });
  });

  server.listen(port);

  return {
    server,
    port,
    close: () =>
      new Promise<void>((resolve, reject) => {
        for (const client of wss.clients) {
          client.close();
        }
        wss.close(() => {
          server.close((err) => (err ? reject(err) : resolve()));
        });
      }),
  };
}

async function generateAndStreamAnswer(
  ws: WebSocket,
  context: ContextBuilder,
  question: string,
  config: SessionConfig
) {
  const send = (message: ServerMessage) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  send({ type: "answer_start", provider: config.llmProvider });

  let fullText = "";
  try {
    const stream = streamAnswer(config.llmProvider, context.getMessages(), question);
    for await (const token of stream) {
      fullText += token;
      send({ type: "answer_token", token });
    }

    send({ type: "answer_complete", answer: parseAnswer(fullText) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "LLM processing failed";
    send({ type: "error", message: msg });
  }
}
